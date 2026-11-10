import { Plugin } from "@opencode/plugin/tui"
import type { Context } from "@opencode/plugin/tui/context"
import { MacOSScrollAccel, SyntaxStyle, TextAttributes } from "@opentui/core"
import type { RGBA, ScrollBoxRenderable } from "@opentui/core"
import { useKeyboard, useTerminalDimensions } from "@opentui/solid"
import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js"
import {
  buildEnhancementPrompt,
  cleanEnhancedPrompt,
  formatEnhanceError,
} from "./enhance.js"
import { loadEnhancerOptions, type EnhancerOptions, type ModelRef } from "./config.js"

type EditorLike = {
  isDestroyed: boolean
  setText(text: string): void
  focus(): void
  gotoBufferEnd(): void
}

type ResultActions = {
  insert: () => void
  copy: () => Promise<boolean>
  retry: () => void
}

type EnhanceResultProps = {
  context: Context
  draft: string
  enhanced: string
  actions: ResultActions
}

const INSET = 3
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const

function Spinner(props: { label: string; color: RGBA }) {
  const [frame, setFrame] = createSignal(0)
  const timer = setInterval(() => {
    setFrame((index) => (index + 1) % SPINNER_FRAMES.length)
  }, 80)
  onCleanup(() => clearInterval(timer))

  return (
    <box flexDirection="row" gap={1} flexShrink={0}>
      <text fg={props.color}>{SPINNER_FRAMES[frame()]}</text>
      <text fg={props.color}>{props.label}</text>
    </box>
  )
}

function captureEditor(context: Context): EditorLike | undefined {
  try {
    const editor = context.renderer.currentFocusedEditor as unknown as EditorLike | null | undefined
    return editor && editor.isDestroyed === false && typeof editor.setText === "function"
      ? editor
      : undefined
  } catch {
    return undefined
  }
}

function setEditorText(editor: EditorLike | undefined, text: string): boolean {
  if (!editor || editor.isDestroyed) return false
  try {
    editor.setText(text)
    editor.focus()
    editor.gotoBufferEnd()
    return true
  } catch {
    return false
  }
}

function showToast(context: Context, message: string, variant: "info" | "success" | "warning" | "error" = "info") {
  context.ui.toast.show({ message, variant })
}

function currentSessionID(context: Context): string | undefined {
  const route = context.ui.router.current()
  return route.type === "session" ? route.sessionID : undefined
}

/**
 * Generate without an open session by creating a short-lived session with the
 * currently selected model, then removing it. This keeps `/enhance` usable from
 * the home screen without using the stateless generation endpoint, which can be
 * blocked by the free-model quota even when session generation works.
 */
async function generateWithoutSession(context: Context, prompt: string) {
  const selected = context.ui.model.current()
  let directory = context.location?.directory
  if (!directory) {
    try {
      directory = context.data.location.default().directory
    } catch {
      directory = undefined
    }
  }
  const session = await context.client.session.create({
    title: "/enhance",
    ...(directory ? { location: { directory } } : {}),
    ...(selected
      ? {
          model: {
            providerID: selected.providerID,
            id: selected.modelID,
            ...(selected.variant ? { variant: selected.variant } : {}),
          },
        }
      : {}),
  })
  try {
    return await context.client.session.generate({ sessionID: session.id, prompt })
  } finally {
    try {
      await context.client.session.remove({ sessionID: session.id })
    } catch {
      // A leftover temporary session must not hide the generation result.
    }
  }
}

function generateEnhanceSyntax(theme: Context["theme"], owner: Context["renderer"]["nativeScene"]) {
  const step = 200
  const syntax = theme.syntax
  const markdown = theme.markdown
  const feedback = theme.text.feedback
  const rule = (
    scope: string[],
    foreground: RGBA,
    style: { background?: RGBA; bold?: boolean; italic?: boolean; underline?: boolean } = {},
  ) => ({ scope, style: { foreground, ...style } })
  const rules = [
    rule(["default"], theme.text.base),
    rule(["prompt"], theme.hue.accent[step]),
    rule(["extmark.file"], feedback.warning.base, { bold: true }),
    rule(["extmark.agent"], theme.categorical[0][step], { bold: true }),
    rule(["extmark.skill"], (theme.categorical[1] ?? theme.categorical[0])[step], { bold: true }),
    rule(["extmark.paste"], theme.text.action.primary.focused, {
      background: feedback.warning.base,
      bold: true,
    }),
    rule(["comment", "comment.documentation"], syntax.comment, { italic: true }),
    rule(["string", "symbol", "character.special", "character"], syntax.string),
    rule(["number", "boolean", "constant", "float"], syntax.number),
    rule(["keyword.return", "keyword.conditional", "keyword.repeat", "keyword.coroutine"], syntax.keyword, {
      italic: true,
    }),
    rule(["keyword.type"], syntax.type, { bold: true, italic: true }),
    rule(["keyword.function", "function.method"], syntax.function),
    rule(["keyword"], syntax.keyword, { italic: true }),
    rule(["keyword.import", "string.escape", "string.regexp", "tag.attribute", "keyword.export"], syntax.keyword),
    rule(["operator", "keyword.operator", "punctuation.delimiter", "keyword.conditional.ternary"], syntax.operator),
    rule(
      ["variable", "variable.parameter", "function.method.call", "function.call", "property", "parameter", "field"],
      syntax.variable,
    ),
    rule(["variable.member", "function", "constructor"], syntax.function),
    rule(["type", "module", "class", "namespace"], syntax.type),
    rule(["type.definition"], syntax.type, { bold: true }),
    rule(["punctuation", "punctuation.bracket"], syntax.punctuation),
    rule(
      ["variable.builtin", "type.builtin", "function.builtin", "module.builtin", "constant.builtin", "variable.super"],
      feedback.error.base,
    ),
    rule(["keyword.directive", "keyword.modifier", "keyword.exception"], syntax.keyword, { italic: true }),
    rule(["punctuation.special", "tag.delimiter"], syntax.operator),
    rule(
      [
        "markup.heading",
        "markup.heading.2",
        "markup.heading.3",
        "markup.heading.4",
        "markup.heading.5",
        "markup.heading.6",
      ],
      markdown.heading,
      { bold: true },
    ),
    rule(["markup.heading.1"], markdown.heading, { bold: true, underline: true }),
    rule(["markup.bold", "markup.strong"], markdown.strong, { bold: true }),
    rule(["markup.italic"], markdown.emphasis, { italic: true }),
    rule(["markup.list"], markdown.listItem),
    rule(["markup.quote"], markdown.blockQuote, { italic: true }),
    rule(["markup.raw", "markup.raw.block"], markdown.code),
    rule(["markup.raw.inline"], markdown.code, { background: theme.background.base }),
    rule(["markup.link", "markup.link.url", "string.special", "string.special.url"], markdown.link, {
      underline: true,
    }),
    rule(["markup.link.label"], markdown.linkText, { underline: true }),
    rule(["label"], markdown.linkText),
    rule(["spell", "nospell"], theme.text.base),
    rule(["markup.underline"], theme.text.base, { underline: true }),
    rule(["comment.error"], feedback.error.base, { italic: true, bold: true }),
    rule(["comment.warning"], feedback.warning.base, { italic: true, bold: true }),
    rule(["comment.todo", "comment.note"], feedback.info.base, { italic: true, bold: true }),
    rule(["attribute", "annotation"], feedback.warning.base),
    rule(["tag"], feedback.error.base),
    rule(["markup.strikethrough", "markup.list.unchecked", "debug"], theme.text.muted),
    rule(["markup.list.checked"], feedback.success.base),
    rule(["diff.plus"], theme.diff.text.added, { background: theme.diff.background.added }),
    rule(["diff.minus"], theme.diff.text.removed, { background: theme.diff.background.removed }),
    rule(["diff.delta"], theme.diff.text.context, { background: theme.diff.background.context }),
    rule(["error"], feedback.error.base, { bold: true }),
    rule(["warning"], feedback.warning.base, { bold: true }),
    rule(["info"], feedback.info.base),
  ]
  return SyntaxStyle.fromTheme(rules, owner)
}

function EnhanceResult(props: EnhanceResultProps) {
  const context = props.context
  const theme = context.theme.surface("dialog")
  const overlay = context.theme
  const dimensions = useTerminalDimensions()
  const maxHeight = createMemo(() => Math.max(8, Math.floor(dimensions().height * 0.6)))
  const syntax = createMemo(() => {
    try {
      return generateEnhanceSyntax(context.theme, context.renderer.nativeScene)
    } catch {
      return undefined
    }
  })

  createEffect(() => {
    const current = syntax()
    onCleanup(() => {
      try {
        current?.destroy()
      } catch {
        // The native renderer may already have disposed owned resources.
      }
    })
  })

  const [copied, setCopied] = createSignal(false)
  const scrollAcceleration = new MacOSScrollAccel()
  let scrollBox: ScrollBoxRenderable | undefined

  const copy = async () => {
    const copied = await props.actions.copy()
    if (copied) setCopied(true)
  }

  context.keymap.layer(() => ({
    mode: "modal",
    commands: [
      {
        id: "prompt.enhance.insert",
        title: "Use enhanced prompt",
        group: "Prompt Enhancer",
        bind: "return",
        run: props.actions.insert,
      },
      {
        id: "prompt.enhance.copy",
        title: "Copy enhanced prompt",
        group: "Prompt Enhancer",
        bind: "c",
        run: () => void copy(),
      },
      {
        id: "prompt.enhance.retry",
        title: "Retry enhancement",
        group: "Prompt Enhancer",
        bind: "r",
        run: props.actions.retry,
      },
    ],
  }))

  useKeyboard((event) => {
    if (!scrollBox) return
    if (event.name === "up" || event.name === "k") scrollBox.scrollBy(-1)
    else if (event.name === "down" || event.name === "j") scrollBox.scrollBy(1)
    else if (event.name === "pageup") scrollBox.scrollBy(-maxHeight())
    else if (event.name === "pagedown") scrollBox.scrollBy(maxHeight())
    else if (event.name === "home") scrollBox.scrollTo(0)
    else if (event.name === "end") scrollBox.scrollTo(scrollBox.scrollHeight)
  })

  const close = () => context.ui.dialog.clear()
  const title = () => props.draft.replace(/\s+/g, " ").trim()

  const hint = (
    label: string,
    shortcut: string,
    onMouseUp?: () => void,
    color: RGBA = theme.text.base,
  ) => (
    <text fg={color} onMouseUp={onMouseUp} wrapMode="none" flexShrink={0}>
      {label} <span style={{ fg: theme.text.muted }}>{shortcut}</span>
    </text>
  )

  return (
    <box flexDirection="column" flexGrow={1} minHeight={0} paddingLeft={INSET} paddingRight={INSET} paddingBottom={1} gap={1}>
      <box flexDirection="row" gap={2} flexShrink={0}>
        <text attributes={TextAttributes.BOLD} fg={theme.text.base} flexShrink={0}>
          /enhance
        </text>
        <text fg={theme.text.muted} wrapMode="none" flexGrow={1} truncate>
          {title()}
        </text>
      </box>

      <box marginLeft={-INSET} marginRight={-INSET}>
        <scrollbox
          ref={(element: ScrollBoxRenderable) => (scrollBox = element)}
          height="auto"
          maxHeight={maxHeight()}
          minHeight={0}
          contentOptions={{ minHeight: 0 }}
          backgroundColor={overlay.background.raised.high}
          scrollX={false}
          scrollY
          scrollAcceleration={scrollAcceleration}
          scrollbarOptions={{ visible: false }}
        >
          <box paddingLeft={INSET} paddingRight={INSET} paddingTop={1} paddingBottom={1}>
            <Show
              when={syntax()}
              fallback={
                <text fg={overlay.markdown.text} bg={overlay.background.raised.high} wrapMode="word">
                  {props.enhanced}
                </text>
              }
            >
              {(style) => (
                <markdown
                  syntaxStyle={style()}
                  content={props.enhanced}
                  conceal
                  internalBlockMode="top-level"
                  tableOptions={{ style: "grid", cellPaddingX: 1 }}
                  fg={overlay.markdown.text}
                  bg={overlay.background.raised.high}
                />
              )}
            </Show>
          </box>
        </scrollbox>
      </box>

      <box
        marginLeft={-INSET}
        marginRight={-INSET}
        marginBottom={-1}
        paddingLeft={INSET - 1}
        paddingRight={INSET - 1}
        paddingTop={1}
        paddingBottom={1}
        backgroundColor={theme.background.raised.high}
        flexDirection="row"
        justifyContent="space-between"
        gap={2}
        flexShrink={0}
      >
        <box flexDirection="row" gap={2} flexShrink={1} minWidth={0} flexWrap="wrap">
          {hint("esc", "restore", close, theme.text.muted)}
          {hint("scroll", "j/k ↑/↓", undefined, theme.text.muted)}
        </box>
        <box flexDirection="row" gap={2} flexShrink={0}>
          {hint(
            copied() ? "✓ copied" : "copy",
            "c",
            () => void copy(),
            copied() ? theme.text.feedback.success.base : theme.text.base,
          )}
          {hint("retry", "r", props.actions.retry, theme.text.muted)}
          {hint("insert", "return", props.actions.insert, theme.text.base)}
        </box>
      </box>
    </box>
  )
}

export default Plugin.define({
  id: "opencode.prompt-enhancer.tui",
  setup(context) {
    // Keep the pending flag in shared memory rather than a local signal. The
    // plugin can be loaded by more than one config layer (global + project),
    // and the instance that runs the command is not necessarily the instance
    // that renders the footer slot. Memory is namespaced by plugin id, so all
    // instances observe the same counter.
    const [pending, setPending] = context.storage.memory("pending", { initial: { count: 0 } })

    const renderStatus = () => (
      <Show when={pending.count > 0}>
        <Spinner label="/enhance" color={context.theme.hue.interactive[200]} />
      </Show>
    )

    const disposePromptStatus = context.ui.slot({
      append: "prompt.footer.status",
      render: renderStatus,
    })
    // The home screen has a separate footer slot; without this claim the
    // indicator never appears when /enhance runs before a session is open.
    const disposeHomeStatus = context.ui.slot({
      append: "home.footer.status",
      render: renderStatus,
    })

    async function enhanceDraft(
      draft: string,
      options: EnhancerOptions,
      editor: EditorLike | undefined,
      restoreText: string | undefined,
      sessionID: string | undefined,
    ) {
      setPending((draft) => {
        draft.count += 1
      })
      let enhanced = ""
      const selected = context.ui.model.current()
      const attempted: ModelRef | undefined =
        options.model ?? (selected ? { providerID: selected.providerID, id: selected.modelID } : undefined)
      try {
        const prompt = buildEnhancementPrompt(options, draft)
        // Generate through the open session by default so the session's
        // model, variant, agent, and context are used. An explicit
        // `model` option is the only reason to use the stateless endpoint.
        // Without an open session, use a temporary session so the selected
        // model still goes through the session generation path.
        const configured = options.model
        const result = configured
          ? await context.client.experimental.generate.text({
              prompt,
              model: { providerID: configured.providerID, id: configured.id },
            })
          : sessionID
            ? await context.client.session.generate({ sessionID, prompt })
            : await generateWithoutSession(context, prompt)
        enhanced = cleanEnhancedPrompt(result.text)
        if (!enhanced) {
          throw new Error(
            sessionID
              ? "The model returned an empty enhancement. If this session is very long, start a new one or switch models with /models, then retry."
              : "The model returned an empty enhancement. Switch models with /models, then retry.",
          )
        }
      } catch (error) {
        if (restoreText) setEditorText(editor, restoreText)
        showToast(context, formatEnhanceError(error, attempted), "error")
        return
      } finally {
        setPending((draft) => {
          draft.count = Math.max(0, draft.count - 1)
        })
      }

      const dialogState = { finished: false, retrying: false }
      const actions: ResultActions = {
        insert: () => {
          dialogState.finished = true
          context.ui.dialog.clear()
          // Let the dialog release focus before writing back to the composer.
          setTimeout(() => {
            const target = captureEditor(context) ?? editor
            const inserted = setEditorText(target, enhanced)
            if (inserted) {
              showToast(context, "Enhanced prompt inserted in the composer.", "success")
            } else {
              const copied = context.renderer.copyToClipboardOSC52(enhanced)
              showToast(
                context,
                copied
                  ? "Could not access the composer; enhanced prompt copied instead."
                  : "Could not access the composer or copy the enhanced prompt.",
                copied ? "warning" : "error",
              )
            }
          }, 0)
        },
        copy: async () => {
          let copied = false
          try {
            copied = context.renderer.copyToClipboardOSC52(enhanced)
          } catch {
            copied = false
          }
          showToast(
            context,
            copied ? "Enhanced prompt copied." : "Could not copy the enhanced prompt.",
            copied ? "success" : "error",
          )
          return copied
        },
        retry: () => {
          dialogState.retrying = true
          context.ui.dialog.clear()
          void enhanceDraft(draft, options, editor, restoreText, sessionID)
        },
      }

      context.ui.dialog.show(
        () => (
          <EnhanceResult context={context} draft={draft} enhanced={enhanced} actions={actions} />
        ),
        () => {
          if (dialogState.finished || dialogState.retrying) return
          if (restoreText) setEditorText(editor, restoreText)
        },
      )
      context.ui.dialog.set({ size: "large", centered: true })
    }

    async function runEnhance(rawInput?: string) {
      const sessionID = currentSessionID(context)

      try {
        let editor = captureEditor(context)
        const loaded = await loadEnhancerOptions(context)
        for (const warning of loaded.warnings) {
          showToast(context, warning, "warning")
        }

        const slashInput = rawInput?.trim() ?? ""
        let draft = slashInput
        if (!draft) {
          draft =
            (await context.ui.dialog.prompt({
              title: "/enhance",
              placeholder: "Describe the prompt you want to improve",
            }))?.trim() ?? ""
          // The prompt dialog takes focus; capture the composer again after it
          // closes so Insert writes to the right editor.
          editor = captureEditor(context) ?? editor
        }
        if (!draft) return

        const restoreText = slashInput ? `/enhance ${draft}` : undefined
        await enhanceDraft(draft, loaded.options, editor, restoreText, sessionID)
      } catch (error) {
        const selected = context.ui.model.current()
        showToast(
          context,
          formatEnhanceError(
            error,
            selected ? { providerID: selected.providerID, id: selected.modelID } : undefined,
          ),
          "error",
        )
      }
    }

    async function showResolvedConfig() {
      const loaded = await loadEnhancerOptions(context)
      for (const warning of loaded.warnings) {
        showToast(context, warning, "warning")
      }
      const message = JSON.stringify(
        {
          sources: loaded.sources.map((source) => ({
            kind: source.kind,
            path: source.path ?? "(activation options)",
            options: source.options,
          })),
          warnings: loaded.warnings,
          options: loaded.options,
        },
        null,
        2,
      )
      await context.ui.dialog.alert({ title: "Prompt enhancer config", message })
    }

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "prompt.enhance",
          title: "Enhance prompt",
          description: "Rewrite the draft prompt with the configured enhancer persona and template",
          group: "Prompt Enhancer",
          palette: true,
          suggested: true,
          slash: { name: "enhance", arguments: true },
          run: async (input) => void runEnhance(input),
        },
        {
          id: "prompt.enhance.config",
          title: "Show prompt enhancer config",
          description: "Show the merged user and project prompt enhancer options",
          group: "Prompt Enhancer",
          palette: true,
          run: async () => void showResolvedConfig(),
        },
      ],
    }))

    return () => {
      disposePromptStatus()
      disposeHomeStatus()
    }
  },
})
