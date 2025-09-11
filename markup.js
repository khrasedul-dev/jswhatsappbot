class Markup {
  static urlButton(text, url) {
    return {
      type: 'url',
      text,
      url,
    }
  }

  static keyboard(buttonRows, text) {
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
