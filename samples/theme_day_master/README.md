# Sample Dry-Run — theme: `day_master_archetype`

Preview of what the full pipeline will produce for one theme,
**without calling the Claude API**. Used to lock in quality targets before
paying for real synthesis.

## Files

| File | What it is |
|---|---|
| `01_prompt_sent_to_claude.txt` | The exact system + user prompt that would be sent to Claude in a real run. Drop-in usable — you can paste this into Claude.ai right now to preview real output. |
| `02_gold_standard_output.json` | Hand-crafted Thai post matching the JSON schema the synthesizer expects. This is the quality target. |
| `slides/pastel_pink/*.png` | 8-slide carousel rendered from the gold standard, pink palette. |
| `slides/pastel_lavender/*.png` | Same content, lavender palette. |
| `slides/pastel_mint/*.png` | Same content, mint palette. |

## Demo input

Three mock Korean saju posts live in `data/posts/saju_demo_kr_0{1,2,3}__*.json`
(note: those files are not tracked; see `.gitignore`).

## How to regenerate

```bash
# Rebuild the prompt dump
python scripts/dump_prompt.py --theme day_master_archetype \
    --out samples/theme_day_master/01_prompt_sent_to_claude.txt

# Re-render slides after editing 02_gold_standard_output.json
python scripts/render_sample.py \
    --json samples/theme_day_master/02_gold_standard_output.json \
    --out samples/theme_day_master/slides
```

## Known issues

- Hanzi and Korean characters are stripped by the renderer
  (`imagegen.renderer.sanitize`) because Noto Sans Thai has no CJK glyphs.
- Emojis are stripped from slide text for the same reason. Captions and CTAs
  keep emojis since those render inside Instagram's own UI.
