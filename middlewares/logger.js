/**
 * Example logger middleware for WhatsApp bot.
 * @returns {function} Middleware function
 */
export default function logger() {
  return async (ctx, next) => {
    await next()
  }
}
