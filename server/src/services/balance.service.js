const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Payment = require('../models/Payment');

/**
 * Compute the net balance for every member in a group.
 *
 * Logic (all integer paise):
 *   Phase 1 — Expenses:
 *     net[paidBy]       += totalAmount
 *     net[split.user]   -= shareAmount
 *
 *   Phase 2 — Payments:
 *     net[payment.from] += payment.amount   (debtor's debt decreases)
 *     net[payment.to]   -= payment.amount   (creditor's credit decreases)
 *
 * A positive net means the user is owed money (creditor).
 * A negative net means the user owes money (debtor).
 *
 * @param {string} groupId
 * @returns {{ userId: string, name: string, email: string, net: number }[]}
 */
const computeNetBalances = async (groupId) => {
    // 1. Verify group exists
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) {
        const error = new Error('Group not found');
        error.statusCode = 404;
        throw error;
    }

    // 2. Fetch all expenses and payments for this group
    const [expenses, payments] = await Promise.all([
        Expense.find({ group: groupId }),
        Payment.find({ group: groupId }),
    ]);

    // 3. Initialize net map for all members at 0
    const netMap = {};
    const memberInfo = {};
    for (const member of group.members) {
        const id = member._id.toString();
        netMap[id] = 0;
        memberInfo[id] = { name: member.name, email: member.email };
    }

    // 4. Phase 1 — Process expenses
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

    // 5. Phase 2 — Apply payments
    for (const payment of payments) {
        const fromId = payment.from.toString();
        const toId = payment.to.toString();

        // Debtor's debt decreases (net moves toward 0)
        if (netMap[fromId] !== undefined) {
            netMap[fromId] += payment.amount;
        }

        // Creditor's credit decreases (net moves toward 0)
        if (netMap[toId] !== undefined) {
            netMap[toId] -= payment.amount;
        }
    }

    // 6. Integrity check — sum of all nets must be exactly 0
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

    // 7. Build result array
    const balances = Object.entries(netMap).map(([userId, net]) => ({
        userId,
        name: memberInfo[userId]?.name || 'Unknown',
        email: memberInfo[userId]?.email || '',
        net,
    }));

    return balances;
};

/**
 * Compute threshold alerts.
 *
 * For each user with net < 0 whose abs(net) >= group.settlementThreshold:
 *   Include in alerts array.
 *
 * @param {{ userId: string, name: string, net: number }[]} balances
 * @param {number} settlementThreshold – integer paise (0 = always alert)
 * @returns {{ userId: string, name: string, amountOwed: number }[]}
 */
const computeThresholdAlerts = (balances, settlementThreshold) => {
    const alerts = [];

    for (const b of balances) {
        if (b.net < 0) {
            const amountOwed = Math.abs(b.net);
            // Threshold of 0 means always alert on any debt
            if (settlementThreshold === 0 || amountOwed >= settlementThreshold) {
                alerts.push({
                    userId: b.userId,
                    name: b.name,
                    amountOwed,
                });
            }
        }
    }

    // Sort by amount descending (largest debts first)
    alerts.sort((a, b) => b.amountOwed - a.amountOwed);

    return alerts;
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

module.exports = { computeNetBalances, computeThresholdAlerts, buildRawDebtGraph };