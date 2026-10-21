import { Types } from 'mongoose';
import { Transaction } from '../models/Transaction';

interface Total {
  _id: Types.ObjectId;
  total: number;
}

/**
 * Net effect of a user's transactions on each account, in paise:
 * income adds, expense subtracts, transfers subtract from the source and add to the destination.
 * Accounts without transactions are absent from the map.
 */
export async function getTransactionTotals(
  userId: string,
  accountIds?: string[],
): Promise<Map<string, number>> {
  const uid = new Types.ObjectId(userId);
  const ids = accountIds?.map((id) => new Types.ObjectId(id));

  // aggregate() doesn't cast types, so ids must already be ObjectIds
  const [result] = await Transaction.aggregate<{ outgoing: Total[]; incoming: Total[] }>([
    {
      $match: ids
        ? { userId: uid, $or: [{ accountId: { $in: ids } }, { toAccountId: { $in: ids } }] }
        : { userId: uid },
    },
    {
      $facet: {
        outgoing: [
          {
            $group: {
              _id: '$accountId',
              total: {
                $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', { $multiply: ['$amount', -1] }] },
              },
            },
          },
        ],
        incoming: [
          { $match: { type: 'transfer' } },
          { $group: { _id: '$toAccountId', total: { $sum: '$amount' } } },
        ],
      },
    },
  ]);

  const totals = new Map<string, number>();
  for (const { _id, total } of [...(result?.outgoing ?? []), ...(result?.incoming ?? [])]) {
    const key = _id.toString();
    totals.set(key, (totals.get(key) ?? 0) + total);
  }
  return totals;
}
