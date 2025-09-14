A **Telegraf-inspired framework** for building **WhatsApp Cloud API bots** with modern **scene** and **session** management.

## 💖 Support My Work

If you enjoy my projects and want to support me, you can donate using **crypto** 🚀

---

### 🌍 Wallet Addresses

| Coin | Network | Address |
|------|---------|---------|
| 🟠 **Bitcoin (BTC)** | Bitcoin | `1PouA4hPvM4sgg26RbbevBuG3JVF2yGiTt` |
| 🔵 **Ethereum (ETH)** | ERC20 | `0x35e743344347b02e0071e8ec2a9850ec4fc879f2` |
| 🟢 **Tether (USDT)** | TRC20 | `TWUbLudtqA65r6tFXrhBigVxgH22GikMct` |
| 🟢 **Tether (USDT)** | ERC20 | `0x35e743344347b02e0071e8ec2a9850ec4fc879f2` |

---

[![Donate Bitcoin](https://img.shields.io/badge/Bitcoin-Donate-orange?logo=bitcoin&style=for-the-badge)](bitcoin:1PouA4hPvM4sgg26RbbevBuG3JVF2yGiTt)
[![Donate Ethereum](https://img.shields.io/badge/Ethereum-Donate-blue?logo=ethereum&style=for-the-badge)](ethereum:0x35e743344347b02e0071e8ec2a9850ec4fc879f2)
[![Donate USDT](https://img.shields.io/badge/USDT-Donate-green?logo=tether&style=for-the-badge)](https://tronscan.org/#/address/TWUbLudtqA65r6tFXrhBigVxgH22GikMct)

---

✨ Thank you for your support — it really means a lot! 🙏



## Features

- Step-by-step **scene system** (Wizard-like)
- In-memory and file-based **session storage**
- **Middleware-based architecture**
- Simple API for **commands**, **actions**, and **media**
- Persistent sessions (optional)
- Clean, modern codebase
- Reply buttons and keyboards
- Media support: images, documents, audio, video
- Global error handling

## Installation

```bash
npm install jswhatsappbot
```


## API
### Default webhook listen
- `https://<your site>/webhook`

### WhatsAppBot

- `command(cmd, fn)` — Register a command handler
- `hears(pattern, fn)` — Register a text/button handler
- `use(middleware)` — Add middleware
- `start(port)` — Start the bot server
- `catch(fn)` — Global error handler

### Scene System

- `Scene(name, steps[])` — Create a scene
- `SceneManager()` — Manage and register scenes
- `scenes.register(scene)` — Register a scene
- `scenes.middleware()` — Scene middleware
- `scenes.enter('sceneName')` — Enter a scene

### Session Middleware

- `session({ type: 'file' })` — Use file-based session (default is in-memory)

### Markup (Buttons, Keyboards, Media)

Import Markup:

```js
import { Markup } from 'jswhatsappbot'
```

#### Reply Buttons (Keyboard)

```js
await ctx.reply(
  Markup.keyboard('Choose an option:', [[{ text: 'Yes' }, { text: 'No' }]])
)
```

### Handle button actions:

```js
bot.hears('Yes', async (ctx) => {
  await ctx.reply('You clicked Yes!')
})
bot.hears('No', async (ctx) => {
  await ctx.reply('You clicked No!')
})
```

#### Media Replies

```js
await ctx.replyWithPhoto('https://example.com/photo.jpg')
await ctx.replyWithDocument('https://example.com/file.pdf')
await ctx.replyWithAudio('https://example.com/audio.mp3')
await ctx.replyWithVideo('https://example.com/video.mp4')
```

### Multiple patterns

```js
bot.hears(['hi', 'hello', /test/], handler)
bot.command(['/start', '/help'], handler)
```

### Example: Registration Scene

```js
import WhatsAppBot, {
  Markup,
  session,
  Scene,
  SceneManager,
} from 'jswhatsappbot'

const bot = new WhatsAppBot({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
})

const registrationScene = new Scene('registration', [
  async (ctx) => {
    await ctx.reply('Welcome to registration! What is your first name?')
  },
  async (ctx) => {
    if (!ctx.text) {
      await ctx.reply('Please enter your first name.')
      return false
    }
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
    await ctx.reply(
      `Registration complete!\nFirst Name: ${ctx.session.firstName}\nLast Name: ${ctx.session.lastName}\nEmail: ${ctx.session.email}`
    )
    await ctx.scene.leave(ctx)
  },
])

const scenes = new SceneManager()
scenes.register(registrationScene)

bot.use(session())
bot.use(scenes.middleware())

bot.command('/start', async (ctx) => {
  await ctx.reply('Welcome! Type /registration to begin.')
})
bot.command('/registration', async (ctx) => {
  await scenes.enter('registration')(ctx)
})
```

## Event System

Handle all incoming messages:

```js
bot.on('message', async (ctx) => {
  // Runs for every incoming message
  console.log('Received message:', ctx.text)
})
```

## Example: Simple Bot

```js
import 'dotenv/config'
import WhatsAppBot, { Markup, session, Scene, SceneManager } from '../index.js'

const bot = new WhatsAppBot({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
})

const registrationScene = new Scene('registration', [
  async (ctx) => {
    await ctx.reply('Welcome to registration! What is your first name?')
  },
  async (ctx) => {
    if (!ctx.text) {
      await ctx.reply('Please enter your first name.')
      return false
    }
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
    await ctx.reply(
      `Registration complete!\nFirst Name: ${ctx.session.firstName}\nLast Name: ${ctx.session.lastName}\nEmail: ${ctx.session.email}`
    )
    await ctx.scene.leave(ctx)
  },
])

const scenes = new SceneManager()
scenes.register(registrationScene)

bot.use(session())
bot.use(scenes.middleware())

bot.command('/start', async (ctx) => {
  await ctx.reply('Welcome! Type /registration to begin.')
})
bot.command('/registration', async (ctx) => {
  await scenes.enter('registration')(ctx)
})

const testPhotoUrl = 'https://www.w3schools.com/w3images/lights.jpg'
const testDocUrl =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
const testAudioUrl =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
const testVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'

bot.hears('/photo', async (ctx) => {
  await ctx.replyWithPhoto(testPhotoUrl)
  await ctx.reply(
    Markup.keyboard('Choose an option:', [[{ text: 'Yes' }, { text: 'No' }]])
  )
})

bot.hears('/keyboard', async (ctx) => {
  await ctx.reply(
    Markup.keyboard('Choose an option:', [
      [{ text: 'Yes' }, { text: 'No' }, { text: 'test button' }],
    ])
  )
})

bot.hears('Yes', async (ctx) => {
  await ctx.reply('You clicked Yes!')
})

bot.hears('No', async (ctx) => {
  await ctx.reply('You clicked No!')
})

bot.on('message', async (ctx) => {
  await ctx.reply('Echo: ' + ctx.text)
})

bot.start(3000)
```

## Custom Express Hosting

You can host whatsappjs with your own Express app:

```js
import express from 'express'
import WhatsAppBot from 'jswhatsappbot'

const bot = new WhatsAppBot({
  /* ...config... */
})

const app = express()
app.use(express.json())

// Mount WhatsApp webhook route
app.use('/webhook', bot.app)

// Start your own server
app.listen(3000, () => {
  console.log('Custom Express server running on port 3000')
})
```

Do not use `bot.start()` if you want full control over your Express server.

## License

MIT

## Author

KH Rasedul — [rasedul.dev@gmail.com](mailto:rasedul.dev@gmail.com)
