# CLAUDE.md

Bu dosya, bu repoda çalışan Claude Code oturumlarına yön verir.

## Proje

**agent-orchestra**: Claude, Google Antigravity (AGY) ve OpenCode'u birbirine
bağlayan "yapay zekâ orkestrası" kurulumunu, başka birinin kendi LLM'iyle tek
adımda yapabilmesini sağlayan bir **Agent Skill**.

Fikir ve kaynak: Buğra Yıldırım'ın Medium yazısı
[Yapay Zekâlarla Orkestra Kurmak](https://medium.com/@bugrayildirim/yapay-zek%C3%A2larla-orkestra-kurmak-78de76f0157c).
Bulut ortamının ağ politikası `medium.com`'u engelliyor; yazının içeriği repoya
eklendiğinde `docs/` altında olacak. Kurulum adımlarını tahmin etme, yazıya dayan.

## Hedef yapı

```text
skills/orchestra/
  SKILL.md       # YAML frontmatter (name, description) + adım adım kurulum
  scripts/       # check-prereqs, setup (sh + ps1), doctor, uninstall
  templates/     # CLAUDE.md, AGENTS.md, opencode.json, MCP ayarları
  references/    # roller, akış, sorun giderme
```

## Kurallar

- Skill, açık Agent Skills formatına uyar: `SKILL.md` + YAML frontmatter.
- Kurulum script'leri idempotent ve etkileşimsiz olmalı; bir şey kurmadan önce
  kontrol etmeli ve skill, kullanıcıdan onay istemeli.
- macOS, Linux ve Windows ayrı ayrı ele alınır.
- Repoya API anahtarı veya sır girmez; gerekiyorsa `.env.example` kullan.
- Kullanıcıya dönük metinler Türkçe; README ileride TR + EN olacak.

## Lint

Her değişiklikten sonra çalıştır (CI'daki kontrollerin aynısı):

```bash
scripts/lint.sh
```

- Markdown: `markdownlint-cli2` (ayarlar `.markdownlint-cli2.jsonc`)
- Shell: `shellcheck`

Bulut oturumlarında bu araçları `.claude/hooks/session-start.sh` kurar.

## Git

- Değişiklikler dalda yapılır, PR ile `main`'e girer.
- Commit mesajları kısa ve açıklayıcı olsun.
