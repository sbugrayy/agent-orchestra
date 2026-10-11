# CLAUDE.md

Bu dosya, bu repoda çalışan Claude Code oturumlarına yön verir.

## Proje

**agent-orchestra**: Claude, Google Antigravity (AGY) ve OpenCode'u birbirine
bağlayan "yapay zekâ orkestrası" kurulumunu, başka birinin kendi LLM'iyle tek
adımda yapabilmesini sağlayan bir **Agent Skill**.

Fikir ve kaynak: Buğra Yıldırım'ın Medium yazısı
[Yapay Zekâlarla Orkestra Kurmak](https://medium.com/@bugrayildirim/yapay-zek%C3%A2larla-orkestra-kurmak-78de76f0157c).
Bulut ortamının ağ politikası `medium.com`'u engelliyor. Yazıdaki bilgiler skill'e
işlendi; kurulum adımlarını tahmin etme, yazıya ve skill'e dayan.

## Yapı

```text
.claude-plugin/          # Claude Code plugin + marketplace manifestleri
skills/agent-orchestra/
  SKILL.md               # YAML frontmatter + adım adım kurulum ve şef protokolü
  scripts/               # doctor, apply-templates, fix-bom (Node.js, bağımlılıksız)
  templates/             # AGENTS.md, CLAUDE.orchestra.md, analyst.md, claude-settings.json
  references/            # workflow.md, troubleshooting.md
tests/                   # node:test ile script testleri
```

Doğrulanmış gerçekler (OpenCode 1.19.0 ile denendi): ajan dosyası
`.opencode/agent/analyst.md` olarak tanınıyor, `permission` haritasında
`"*": deny` ve ardından okuma izinleri çalışıyor, `opencode run --agent <ad>`
geçerli. `agy` bu ortamda kurulamıyor; bayrakları yazıdaki çalışan çağrıya
dayanıyor, kullanıcıya `agy --help` ile doğrulatılıyor.

## Kurallar

- Skill, açık Agent Skills formatına uyar: `SKILL.md` + YAML frontmatter.
- Kurulum script'leri idempotent ve etkileşimsiz olmalı; bir şey kurmadan önce
  kontrol etmeli ve skill, kullanıcıdan onay istemeli.
- macOS, Linux ve Windows ayrı ayrı ele alınır.
- Repoya API anahtarı veya sır girmez; gerekiyorsa `.env.example` kullan.
- Skill ve şablonlar İngilizce (uluslararası kullanım); skill, kullanıcıyla
  onun dilinde konuşur. README TR + EN.
- Script'ler sadece Node.js kullanır (Windows/macOS/Linux için tek kod).

## Kontroller

Her değişiklikten sonra çalıştır (CI'daki kontrollerin aynısı):

```bash
scripts/check.sh
```

- Markdown: `markdownlint-cli2` (ayarlar `.markdownlint-cli2.jsonc`;
  şablonlar için `templates/.markdownlint.jsonc`)
- Shell: `shellcheck`
- Node: `node --check` ve `node --test tests/*.test.mjs`
- Plugin manifestleri: `claude plugin validate .`

Bulut oturumlarında bu araçları `.claude/hooks/session-start.sh` kurar.

## Git

- Değişiklikler dalda yapılır, PR ile `main`'e girer.
- Commit mesajları kısa ve açıklayıcı olsun.
