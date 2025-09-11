import 'dotenv/config'
import WhatsAppBot, { Markup, session, Scene, SceneManager } from '../index.js'
import logger from '../middlewares/logger.js'


// --- Bot Setup ---
const bot = new WhatsAppBot({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
})

// --- Global Error Handler ---
bot.catch(async (err, ctx) => {
  console.error('Global error:', err)
  if (ctx && ctx.reply) {
    await ctx.reply('An error occurred: ' + err.message)
  }
})

// --- Registration Scene ---
const registrationScene = new Scene('registration', [
  async (ctx) => {
    await ctx.reply('Welcome to registration! What is your first name?')
  },
  async (ctx) => {
    if (!ctx.text) return false
    ctx.session.firstName = ctx.text
    await ctx.reply('What is your last name?')
  },
  async (ctx) => {
    if (!ctx.text) {
      await ctx.reply('Please enter your last name.')
      return false
    }
    ctx.session.lastName = ctx.text
    await ctx.reply('What is your email address?')
  },
  async (ctx) => {
    if (!ctx.text || !/\S+@\S+\.\S+/.test(ctx.text)) {
      await ctx.reply('Please enter a valid email address.')
      return false
    }
    ctx.session.email = ctx.text
    await ctx.reply('Registration complete!')
    await ctx.scene.leave(ctx)
  },
])

// --- Scene Manager ---
const scenes = new SceneManager()
scenes.register(registrationScene)

bot.use(logger())
bot.use(session())
bot.use(scenes.middleware())

// --- Commands ---
bot.command(["/start", "/help"], async (ctx) => {
  await ctx.reply('Welcome! Type /registration to begin.')
})

bot.hears(["hi", "hello", /test/], ctx => ctx.reply('Hello! How can I assist you today?'))

bot.command('/registration', async (ctx) => {
  await scenes.enter('registration')(ctx)
})

// --- Media URLs ---
const testPhotoUrl = 'https://www.w3schools.com/w3images/lights.jpg'
const testDocUrl =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
const testAudioUrl =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
const testVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'

bot.hears('/photo', async (ctx) => {
  // Send photo first
  await ctx.replyWithPhoto(testPhotoUrl)
  // Then send buttons as a separate text message
  await ctx.reply(
    Markup.keyboard([[{ text: 'Yes' }, { text: 'No' }]], 'Choose an option:')
  )
})

// --- Media Event Handlers ---
bot.on('image', async (ctx) => {
  await ctx.reply('You sent an image!')
  await ctx.replyWithPhoto(testPhotoUrl)
})

bot.on('document', async (ctx) => {
  if (ctx.files && ctx.files.length > 0) {
    await ctx.reply('You sent a document!')
    await ctx.replyWithDocument(testDocUrl)
  }
})

bot.on('audio', async (ctx) => {
  await ctx.reply('You sent an audio file!')
  await ctx.replyWithAudio(testAudioUrl)
})

bot.on('video', async (ctx) => {
  await ctx.reply('You sent a video!')
  await ctx.replyWithVideo(testVideoUrl)
})

// --- Keyboard and Button Replies ---
bot.hears('/keyboard', async (ctx) => {
  await ctx.reply(
    Markup.keyboard(
      [[{ text: 'Yes' }, { text: 'No' }, { text: 'test button' }]],
      'Choose an option:'
    )
  )
})

// Handle reply button actions (WhatsApp sends text with payload)
bot.hears('test button', async (ctx) => {
  await ctx.reply('You clicked test button!')
})

bot.hears('Yes', async (ctx) => {
  console.log('Yes button pressed:', ctx.text)
  await ctx.reply('You clicked Yes!')
})

bot.hears('No', async (ctx) => {
  await ctx.reply('You clicked No!')
})

bot.hears('inlineKeyboard', async (ctx) => {
  await ctx.reply(
    Markup.keyboard(
      [[{ text: 'Button 1' }, { text: 'Button 2' }, { text: 'Visit Google' }]],
      'Click a button:'
    )
  )
})

// Handle inline button actions
bot.hears('Button 1', async (ctx) => {
  await ctx.reply('You clicked Inline Button 1 ✅')
  await ctx.replyWithPhoto(testPhotoUrl)
})
bot.hears('Button 2', async (ctx) => {
  await ctx.reply('You clicked Inline Button 2 ✅')
  await ctx.replyWithDocument(testDocUrl)
})
bot.hears('Visit Google', async (ctx) => {
  await ctx.reply('You clicked Visit Google!')
})

bot.hears(/yes/i, async (ctx) => {
  await ctx.reply('You clicked Button Yes')
})

bot.hears(/no/i, async (ctx) => {
  await ctx.reply('You clicked Button No')
})

// --- Log all messages ---
bot.on('message', async (ctx) => {
  if (ctx._handled) return
  console.log('Generic handler received text:', ctx.text)
  await ctx.reply('Echo: ' + ctx.text)
})

// --- Start bot ---
bot.start(3000)
