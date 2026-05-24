---
title: "Instalação e Configuração"
description: "Instale Python, configure seu ambiente de desenvolvimento e escreva seu primeiro programa usando VS Code"
order: 2
duration: "25 minutos"
difficulty: "iniciante"
---

# Instalação e Configuração

Antes de escrever código Python, você precisa instalar o Python e escolher um editor de código. Esta lição guia você por cada etapa.

## Instalando Python

### Windows
1. Acesse [python.org/downloads](https://python.org/downloads)
2. Baixe o Python 3.x para Windows
3. **Marque** "Add Python to PATH" durante a instalação
4. Clique em Instalar

Verifique a instalação:
```bash
python --version
```

### macOS
```bash
# Usando Homebrew
brew install python3

# Verifique
python3 --version
```

### Linux
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip

# Verifique
python3 --version
```

> [!NOTE]
> No macOS e Linux, digite `python3` em vez de `python`. No Windows, apenas `python` funciona.

## Escolhendo um Editor de Código

### VS Code (Recomendado)
1. Baixe de [code.visualstudio.com](https://code.visualstudio.com)
2. Instale a **extensão Python** da Microsoft
3. Instale o **Pylance** language server

### PyCharm
Uma IDE construída especificamente para Python, disponível nas edições gratuita (Community) e paga (Professional).

## Seu Primeiro Arquivo Python

Crie um arquivo chamado `hello.py`:

```python
# Isto é um comentário
print("Hello, World!")
name = input("What is your name? ")
print(f"Nice to meet you, {name}!")
```

Execute:
```bash
python hello.py
```

## Usando o REPL do Python

O REPL (Read-Eval-Print Loop) permite testar código interativamente:

```bash
python
```

```python
>>> 5 * 7
35
>>> for i in range(3):
...     print(i)
...
0
1
2
>>> exit()
```

## Trabalhando com pip

pip é o gerenciador de pacotes do Python:

```bash
# Instalar um pacote
pip install requests

# Listar pacotes instalados
pip list

# Instalar a partir de um arquivo de requisitos
pip install -r requirements.txt
```

## Ambientes Virtuais (Básico)

Isole dependências de projetos:

```bash
# Criar um ambiente virtual
python -m venv myenv

# Ativar (Windows)
myenv\Scripts\activate

# Ativar (macOS/Linux)
source myenv/bin/activate
```

> [!WARNING]
> Sempre use ambientes virtuais para projetos para evitar conflitos de dependências!

## Convenções de Estrutura de Projetos

```
my-project/
├── main.py
├── requirements.txt
├── README.md
└── myenv/          # Ambiente virtual (não commitar)
```

> [!SUCCESS]
> Um bom editor com a extensão Python oferece: realce de sintaxe, autocompletar, verificação de erros e depuração — tudo essencial para codificação produtiva.

## Perguntas de Prática

1. Qual comando verifica sua instalação do Python?
2. Para que serve o REPL do Python?
3. O que `pip install requests` faz?
4. Por que você deve usar ambientes virtuais?
5. Como ativar um ambiente virtual no Linux?
6. Qual extensão você deve instalar no VS Code para Python?
7. Qual a diferença entre uma IDE e um editor de texto?
8. Como sair do REPL do Python?
9. O que `pip list` mostra?
10. Crie um comando que instala todos os pacotes de um arquivo de requisitos.
