import type { QueryResolvers, UserResolvers } from 'types/graphql'

import { db } from 'src/lib/db'

export {};

export const user: QueryResolvers['user'] = ({ id }) => {
  return db.user.findUnique({
    where: { id },
  })
}

export const User: UserResolvers = {
  posts: (_obj, { root }) =>
    db.user.findUnique({ where: { id: root.id } }).posts(),
}
