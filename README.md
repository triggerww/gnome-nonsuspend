# Non Suspend

Extensão simples para o GNOME Shell que mantém o notebook ligado quando a tampa é fechada. Ela adiciona um botão ao menu de Quick Settings para ativar ou desativar esse comportamento.

## Estado do projeto

Este projeto ainda está em **alfa** (`0.1.0-alpha.1`). O código foi gerado rapidamente com IA, em um estilo que pode ser descrito como *AI slop*, e apenas revisado por mim. Portanto, podem existir problemas, decisões simplificadas ou incompatibilidades não descobertas.

Foi testado no **Fedora 44 Workstation** com **GNOME Shell 50**. Em princípio, deve funcionar em qualquer distribuição que use o GNOME Shell 50, mas isso ainda não foi validado em todas elas.

## Como funciona

Quando ativada, a extensão inicia o seguinte mecanismo do systemd:

```text
systemd-inhibit --what=handle-lid-switch --mode=block ... sleep infinity
```

Isso bloqueia a ação configurada para o fechamento da tampa enquanto o toggle estiver ativo. A extensão não altera permanentemente as configurações do sistema. Ao desativá-la ou desligá-la, o processo de bloqueio é encerrado.

## Requisitos

- GNOME Shell 50
- `systemd-inhibit`
- `glib-compile-schemas`
- `gnome-extensions` e `gsettings` para ativação automática
- Node.js apenas para executar a verificação de sintaxe do `Makefile`

## Instalação

Clone ou baixe este repositório e execute:

```bash
chmod +x install.sh
./install.sh
```

O instalador copia a extensão para:

```text
~/.local/share/gnome-shell/extensions/nonsuspend@local
```

Depois da instalação, o botão **Non Suspend** aparecerá no menu de Quick Settings. Se a extensão não for ativada imediatamente, encerre e inicie novamente a sessão do GNOME.

Também é possível instalar usando o `Makefile`:

```bash
make install
```

## Uso

1. Abra o menu de Quick Settings do GNOME.
2. Localize o botão **Non Suspend**.
3. Ative-o antes de fechar a tampa.
4. Desative-o quando quiser restaurar o comportamento normal.

O estado do toggle é salvo nas configurações da extensão, mas o bloqueio só permanece enquanto a extensão estiver ativa e o processo `systemd-inhibit` estiver funcionando.

## Verificação

Para verificar a sintaxe do JavaScript e compilar o schema localmente:

```bash
make check
```

## Desinstalação

```bash
./uninstall.sh
```

Ou:

```bash
make uninstall
```

## Limitações e observações

- O suporte declarado atualmente é somente para GNOME Shell 50.
- O comportamento depende do `systemd-logind` e da configuração de energia da distribuição.
- A extensão bloqueia o tratamento do evento de fechamento da tampa; ela não pretende substituir todas as configurações de suspensão do sistema.
- Este projeto não é considerado estável. Faça seus próprios testes antes de usá-lo em uma máquina de trabalho.

## Licença

Consulte o arquivo [LICENSE](LICENSE).

## Authors

- [@triggwer](https://github.com/triggwer)