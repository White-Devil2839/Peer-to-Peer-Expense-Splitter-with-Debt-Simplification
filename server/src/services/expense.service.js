const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { isValidPaise } = require('../utils/money');

/**
 * Compute equal-split shares deterministically.
 * Distributes remainder paise to the first N users so sum === totalAmount exactly.
 *
 * Example: 10000 paise / 3 users → [3334, 3333, 3333]
 *
 * @param {number} totalAmount – integer paise
 * @param {string[]} userIds – array of user ObjectId strings
 * @returns {{ user: string, shareAmount: number }[]}
 */
const computeEqualSplits = (totalAmount, userIds) => {
    const count = userIds.length;
    const base = Math.floor(totalAmount / count);
    const remainder = totalAmount - base * count; // always 0 <= remainder < count

    return userIds.map((userId, index) => ({
        user: userId,
        shareAmount: base + (index < remainder ? 1 : 0),
        paidAmount: 0,
    }));
};

/**
 * Add an expense to a group.
 *
 * @param {object} data – { group, description, totalAmount, paidBy, equalSplit, splitUsers, splits, isRecurring, recurrence }
 * @param {string} userId – authenticated user's ID
 */
const addExpense = async (data, userId) => {
    const {
        group: groupId,
        description,
        totalAmount,
        paidBy,
        equalSplit,
        splitUsers,
        splits: customSplits,
        isRecurring,
        recurrence,
    } = data;

    // ---- 1. Verify group exists ----
    const group = await Group.findById(groupId);
    if (!group) {
        const error = new Error('Group not found');
        error.statusCode = 404;
        throw error;
    }

    const memberIds = group.members.map((m) => m.toString());

    // ---- 2. Verify authenticated user is a member ----
    if (!memberIds.includes(userId.toString())) {
        const error = new Error('You are not a member of this group');
        error.statusCode = 403;
        throw error;
    }

    // ---- 3. Verify paidBy is a member ----
    if (!memberIds.includes(paidBy.toString())) {
        const error = new Error('Payer must be a member of the group');
        error.statusCode = 400;
        throw error;
    }

    // ---- 4. Validate totalAmount ----
    if (!isValidPaise(totalAmount) || totalAmount < 1) {
        const error = new Error('Total amount must be a positive integer (paise)');
        error.statusCode = 400;
        throw error;
    }

    // ---- 5. Build splits ----
    let splits;

    if (equalSplit) {
        // Equal split mode
        if (!splitUsers || !Array.isArray(splitUsers) || splitUsers.length === 0) {
            const error = new Error('Split users are required for equal split');
            error.statusCode = 400;
            throw error;
        }

        // Verify all split users are members
        for (const uid of splitUsers) {
            if (!memberIds.includes(uid.toString())) {
                const error = new Error(`User ${uid} is not a member of this group`);
                error.statusCode = 400;
                throw error;
            }
        }

        // Check for duplicates
        const uniqueUsers = new Set(splitUsers.map((u) => u.toString()));
        if (uniqueUsers.size !== splitUsers.length) {
            const error = new Error('Duplicate users in split');
            error.statusCode = 400;
            throw error;
        }

        splits = computeEqualSplits(totalAmount, splitUsers);
    } else {
        // Custom split mode
        if (!customSplits || !Array.isArray(customSplits) || customSplits.length === 0) {
            const error = new Error('Splits are required');
            error.statusCode = 400;
            throw error;
        }

        // Validate each split
        const seenUsers = new Set();
        let splitSum = 0;

        for (const split of customSplits) {
            if (!split.user) {
                const error = new Error('Each split must have a user');
                error.statusCode = 400;
                throw error;
            }

            // Check membership
            if (!memberIds.includes(split.user.toString())) {
                const error = new Error(`User ${split.user} is not a member of this group`);
                error.statusCode = 400;
                throw error;
            }

            // Check duplicates
            const uid = split.user.toString();
            if (seenUsers.has(uid)) {
                const error = new Error('Duplicate users in splits');
                error.statusCode = 400;
                throw error;
            }
            seenUsers.add(uid);

            // Validate shareAmount
            if (!isValidPaise(split.shareAmount)) {
                const error = new Error('Each share amount must be a non-negative integer (paise)');
                error.statusCode = 400;
                throw error;
            }

            splitSum += split.shareAmount;
        }

        // ---- 6. Verify sum of shares === totalAmount ----
        if (splitSum !== totalAmount) {
            const error = new Error(
                `Sum of shares (${splitSum}) does not equal total amount (${totalAmount})`
            );
            error.statusCode = 400;
            throw error;
        }

        splits = customSplits.map((s) => ({
            user: s.user,
            shareAmount: s.shareAmount,
            paidAmount: 0,
        }));
    }

    // ---- 7. Create expense ----
    const expenseData = {
        group: groupId,
        createdBy: userId,
        description,
        totalAmount,
        paidBy,
        splits,
        isRecurring: isRecurring || false,
    };

    if (isRecurring && recurrence) {
        expenseData.recurrence = {
            frequency: recurrence.frequency,
            interval: recurrence.interval || 1,
        };
    }

    const expense = await Expense.create(expenseData);

    return expense.populate([
        { path: 'paidBy', select: 'name email' },
        { path: 'splits.user', select: 'name email' },
        { path: 'createdBy', select: 'name email' },
    ]);
};

/**
 * Get all expenses for a group.
 * Only accessible by group members.
 */
const getGroupExpenses = async (groupId, userId) => {
    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
        const error = new Error('Group not found');
        error.statusCode = 404;
        throw error;
    }

    // Verify user is a member
    const isMember = group.members.some(
        (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
        const error = new Error('You are not a member of this group');
        error.statusCode = 403;
        throw error;
    }

    const expenses = await Expense.find({ group: groupId })
        .populate('paidBy', 'name email')
        .populate('splits.user', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

    return expenses;
};

module.exports = { addExpense, getGroupExpenses, computeEqualSplits };
