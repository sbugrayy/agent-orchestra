# agent-orchestra

[Türkçe](#türkçe) · [English](#english)

## Türkçe

Claude Code'u bir orkestra şefi yapan Agent Skill. Şef, kod yazdırmak için
**Antigravity CLI (`agy`)**'yi, büyük dosyaları özetletmek için de NVIDIA'nın
ücretsiz modelleriyle çalışan **OpenCode**'u kullanır. Sen sadece ne
istediğini söylersin; şef görevi netleştirir, `agy`'ye yazdırır, sonucu
denetler ve test eder.

| Rol | Araç | Görev |
| --- | --- | --- |
| Şef | Claude Code | Planlar, görev yazar, denetler, test eder |
| Kodlayıcı | Antigravity CLI (`agy`) | Şefin yazdığı göreve göre, yalnızca izin verilen dosyalarda kod yazar |
| Analist | OpenCode + NVIDIA NIM | Büyük dosyaları okur ve özetler. Salt-okunur |

Fikrin hikâyesi: [Yapay Zekâlarla Orkestra Kurmak](https://medium.com/@bugrayildirim/yapay-zek%C3%A2larla-orkestra-kurmak-78de76f0157c)

### Kurulum

**Claude Code kullanıyorsan** (önerilen):

```text
/plugin marketplace add sbugrayy/agent-orchestra
/plugin install agent-orchestra@agent-orchestra
```

Ardından projende Claude Code'a şunu yaz: **"Bu projede yapay zekâ
orkestrasını kur."**

**Elle:** `skills/agent-orchestra` klasörünü `~/.claude/skills/` altına
(bütün projeler için) ya da projendeki `.claude/skills/` altına kopyala.

**Başka bir yapay zekâ aracı kullanıyorsan** (Codex, OpenCode vb.), ona şunu
yapıştır:

```text
https://github.com/sbugrayy/agent-orchestra reposunu klonla,
skills/agent-orchestra/SKILL.md dosyasını oku ve bu projede adım adım uygula.
Her kurulum komutundan önce bana sor.
```

### Ne gerekiyor?

- Node.js 18+ ve Git
- Ücretsiz bir NVIDIA API anahtarı: <https://build.nvidia.com>
- Bir Google hesabı (Antigravity için)

Gerisini skill kurar ya da sana adım adım söyler. Girişleri (NVIDIA anahtarı,
Google hesabı) güvenlik için kendi terminalinde sen yaparsın; anahtarın asla
sohbete ya da projeye girmez.

### Neler kuruluyor?

Projene şunlar eklenir:

- `AGENTS.md`: `agy` ve OpenCode'un uyacağı kurallar
- `CLAUDE.md`: şefin görev dağıtma ve denetleme talimatları
- `.opencode/agent/analyst.md`: yazamayan, komut çalıştıramayan, internete
  çıkamayan analist
- `.claude/settings.json`: şefin `agy` ve `opencode` komutlarını her
  seferinde onay sormadan çalıştırabilmesi için izinler

Kurulumda bilmen gereken tuzaklar (BOM, `--new-project`, boş cevaplar) da
skill'in içinde. Ayrıntı: [sorun giderme](skills/agent-orchestra/references/troubleshooting.md).

## English

An Agent Skill that turns Claude Code into the conductor of an AI orchestra.
The conductor has **Antigravity CLI (`agy`)** write code and **OpenCode**,
running free NVIDIA NIM models, summarise large files. You say what you want;
the conductor writes a precise task brief, hands it to `agy`, then reviews and
tests the result.

### Install

In Claude Code:

```text
/plugin marketplace add sbugrayy/agent-orchestra
/plugin install agent-orchestra@agent-orchestra
```

Then tell Claude Code in your project: **"Set up the AI orchestra in this
project."**

Manual: copy `skills/agent-orchestra` into `~/.claude/skills/` or your
project's `.claude/skills/`.

With any other agent, paste:

```text
Clone https://github.com/sbugrayy/agent-orchestra, read
skills/agent-orchestra/SKILL.md and apply it to this project step by step.
Ask me before every install command.
```

You need Node.js 18+, Git, a free NVIDIA API key from
<https://build.nvidia.com> and a Google account for Antigravity.

## Development

```bash
scripts/check.sh   # markdownlint, shellcheck, node --check, tests
```
