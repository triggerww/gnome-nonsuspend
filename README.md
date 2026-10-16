# Non Suspend

Extensão do GNOME Shell que mantém o notebook ligado ao fechar a tampa.

Versão atual: `0.2.0-alpha.1`.

## Comportamento

- O botão **Suspensão** fica no Quick Settings.
- Com a extensão ativa e a tampa aberta, a tela não apaga automaticamente.
- Ao fechar a tampa, o bloqueio de suspensão continua ativo.
- O perfil de energia muda para `powersave` via TuneD no Fedora.
- O brilho vai ao mínimo e o áudio é silenciado.
- Ao abrir a tampa, brilho, volume e mudo anteriores são restaurados.
- O cadeado aparece na barra superior enquanto a extensão está ativa.

Se o TuneD não estiver disponível, a extensão tenta usar `power-profiles-daemon`.
Sem nenhum dos dois, o bloqueio da tampa continua funcionando.

## Requisitos

- GNOME Shell 50
- `systemd-inhibit`
- UPower
- `wpctl` para controlar o áudio
- `brightnessctl` para controlar o brilho
- `glib-compile-schemas`
- `gnome-extensions`
- Node.js para `make check`

No Fedora, o TuneD é recomendado:

```bash
sudo dnf install tuned
```

## Instalação

Na raiz do projeto:

```bash
chmod +x install.sh
./install.sh
```

Ou:

```bash
make install
```

Se a extensão não aparecer imediatamente, desative e ative-a novamente no GNOME.

## Verificação

```bash
make check
```

## Desinstalação

```bash
make uninstall
```

## Estrutura

```text
extension.js                  Ciclo de vida da extensão
src/indicator.js              Quick Settings e indicador visual
src/inhibitor.js              Bloqueio de suspensão da tampa
src/lid-monitor.js            Estado da tampa via UPower
src/idle-inhibitor.js         Bloqueio do apagamento automático
src/power-manager.js          TuneD, fallback e estado dos dispositivos
src/device-state.js           Brilho e áudio restauráveis
schemas/                      Configuração GSettings
```

## Limitações

- Compatibilidade declarada: GNOME Shell 50.
- O perfil econômico depende do TuneD ou do `power-profiles-daemon`.
- O brilho depende do `brightnessctl`; sem ele, apenas o áudio é alterado.
- O comportamento de energia depende da configuração da distribuição.

## Licença

Consulte [LICENSE](LICENSE).