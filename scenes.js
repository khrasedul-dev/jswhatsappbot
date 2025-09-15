/**
 * Represents a multi-step conversational scene.
 * @class
 */
class Scene {
  /**
   * Creates a Scene instance.
   * @param {string} name Scene name
   * @param {Array<function>} steps Array of step handler functions
   */
  constructor(name, steps) {
    this.name = name
    this.steps = steps
  }

  /**
   * Enters the scene and starts at step 0.
   * @param {Context} ctx
   */
  async enter(ctx) {
    ctx.session.__scene = this.name
    ctx.session.step = 0
    ctx.scene = this
    // Immediately run first step so user gets the first question
    await this.handle(ctx)
  }

  /**
   * Leaves the scene and clears session data.
   * @param {Context} ctx
   */
  async leave(ctx) {
    Object.keys(ctx.session).forEach((k) => {
      delete ctx.session[k]
    })
    ctx.scene = null
    ctx._sceneStopped = true
  }

  /**
   * Handles the current step in the scene.
   * @param {Context} ctx
   */
  async handle(ctx) {
    let step = typeof ctx.session.step === 'number' ? ctx.session.step : 0
    if (step < this.steps.length) {
      const prevStep = step
      const result = await this.steps[step](ctx)
      if (ctx.session.step === prevStep && ctx.text && result !== false) {
        ctx.session.step++
      }
    } else {
      await this.leave(ctx)
    }
  }
}

/**
 * Manages multiple scenes and provides middleware for scene handling.
 * @class
 */
class SceneManager {
  /**
   * Creates a SceneManager instance.
   */
  constructor() {
    this.scenes = {}
  }

  /**
   * Registers a scene.
   * @param {Scene} scene Scene instance
   */
  register(scene) {
    this.scenes[scene.name] = scene
  }

  /**
   * Returns middleware for scene handling.
   * @returns {function} Middleware function
   */
  middleware() {
    return async (ctx, next) => {
      const sceneName = ctx.session?.__scene
      let handled = false
      if (sceneName && this.scenes[sceneName] && !ctx._sceneStopped) {
        ctx.scene = this.scenes[sceneName]
        await this.scenes[sceneName].handle(ctx)
        handled = true
      }
      if (!handled) {
        await next()
      }
    }
  }

  /**
   * Returns a function to enter a scene by name.
   * @param {string} name Scene name
   * @returns {function} Function to enter scene
   */
  enter(name) {
    return async (ctx) => {
      const scene = this.scenes[name]
      if (scene) await scene.enter(ctx)
    }
  }
}

export { Scene, SceneManager }
