/**
 * Utility for creating WhatsApp reply buttons and keyboards.
 * @class
 */
class Markup {
  /**
   * WARNING: WhatsApp Cloud API does NOT support URL buttons.
   * This method is not supported and will not work on WhatsApp.
   * If you need to share a link, include it in the message text instead.
   * @deprecated
   */
  static urlButton() {
    throw new Error(
      'WhatsApp does not support URL buttons. Use reply buttons or include links in message text.'
    )
  }

  /**
   * Creates a reply keyboard for WhatsApp (single row, max 3 buttons).
   * @param {string} text Message text
   * @param {Array<Array<object|string>>} buttonRows Array of button rows
   * @returns {object} Interactive keyboard payload
   */
  static keyboard(text, buttonRows) {
    // WhatsApp only supports one row and max 3 buttons for reply buttons
    if (!Array.isArray(buttonRows) || buttonRows.length !== 1) {
      throw new Error(
        'WhatsApp reply buttons only support a single row. Use [[{ text: ... }, ...]].'
      )
    }
    if (buttonRows[0].length > 3) {
      throw new Error(
        'WhatsApp reply buttons only support up to 3 buttons per row.'
      )
    }
    const buttons = buttonRows[0].map((btn) => ({
      type: 'reply',
      reply: {
        id: btn.text || btn,
        title: btn.text || btn,
      },
    }))
    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        action: { buttons },
      },
    }
  }
}

export default Markup
