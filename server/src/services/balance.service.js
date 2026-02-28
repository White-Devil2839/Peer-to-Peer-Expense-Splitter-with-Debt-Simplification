const Expense = require('../models/Expense');
const Group = require('../models/Group');

/**
 * Compute the net balance for every member in a group.
 *
 * Logic (all integer paise):
 *   For each expense:
 *     net[paidBy]       += totalAmount
 *     net[split.user]   -= shareAmount   (for every split)
 *
 * A positive net means the user is owed money (creditor).
 * A negative net means the user owes money (debtor).
 *
 * @param {string} groupId
 * @returns {{ balances: { userId: string, name: string, email: string, net: number }[] }}
 */
const computeNetBalances = async (groupId) => {
    // 1. Verify group exists
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) {
        const error = new Error('Group not found');
        error.statusCode = 404;
        throw error;
    }

    // 2. Fetch all expenses for this group
    const expenses = await Expense.find({ group: groupId });

    // 3. Initialize net map for all members at 0
    const netMap = {};
    const memberInfo = {};
    for (const member of group.members) {
        const id = member._id.toString();
        netMap[id] = 0;
        memberInfo[id] = { name: member.name, email: member.email };
    }

    // 4. Process each expense
    for (const expense of expenses) {
        const payerId = expense.paidBy.toString();

        // Payer gains the total amount (they paid upfront)
        if (netMap[payerId] !== undefined) {
            netMap[payerId] += expense.totalAmount;
        }

        // Each split user owes their share
        for (const split of expense.splits) {
            const userId = split.user.toString();
            if (netMap[userId] !== undefined) {
                netMap[userId] -= split.shareAmount;
            }
        }
    }

    // 5. Integrity check — sum of all nets must be exactly 0
    let totalNet = 0;
    for (const id of Object.keys(netMap)) {
        totalNet += netMap[id];
    }
    if (totalNet !== 0) {
        const error = new Error(
            `Balance inconsistency detected: net sum is ${totalNet}, expected 0`
        );
        error.statusCode = 500;
        throw error;
    }

    // 6. Build result array
    const balances = Object.entries(netMap).map(([userId, net]) => ({
        userId,
        name: memberInfo[userId]?.name || 'Unknown',
        email: memberInfo[userId]?.email || '',
        net,
    }));

    return balances;
};

/**
 * Build the raw (un-simplified) debt graph from all expenses.
 *
 * For each expense, for each split where split.user !== paidBy:
 *   split.user owes paidBy → edge { from: split.user, to: paidBy, amount: shareAmount }
 *
 * Duplicate edges (same from→to) are aggregated by summing amounts.
 *
 * @param {string} groupId
 * @returns {{ from: string, to: string, fromName: string, toName: string, amount: number }[]}
 */
const buildRawDebtGraph = async (groupId) => {
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) {
        const error = new Error('Group not found');
        error.statusCode = 404;
        throw error;
    }

    const expenses = await Expense.find({ group: groupId });

    // Build member name lookup
    const memberNames = {};
    for (const m of group.members) {
        memberNames[m._id.toString()] = m.name;
    }

    // Aggregate edges: key = "from|to"
    const edgeMap = {};

    for (const expense of expenses) {
        const payerId = expense.paidBy.toString();

        for (const split of expense.splits) {
            const debtorId = split.user.toString();

            // Skip self-debt (payer owes themselves nothing)
            if (debtorId === payerId) continue;

            const key = `${debtorId}|${payerId}`;
            if (!edgeMap[key]) {
                edgeMap[key] = {
                    from: debtorId,
                    to: payerId,
                    fromName: memberNames[debtorId] || 'Unknown',
                    toName: memberNames[payerId] || 'Unknown',
                    amount: 0,
                };
            }
            edgeMap[key].amount += split.shareAmount;
        }
    }

    return Object.values(edgeMap).filter((e) => e.amount > 0);
};

module.exports = { computeNetBalances, buildRawDebtGraph };