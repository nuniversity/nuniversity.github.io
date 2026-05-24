---
title: "Instalación y Configuración"
description: "Instala Python, configura tu entorno de desarrollo y escribe tu primer programa usando VS Code"
order: 2
duration: "25 minutos"
difficulty: "beginner"
---

# Instalación y Configuración

Antes de escribir código Python, necesitas instalar Python y elegir un editor de código. Esta lección te guía paso a paso.

## Instalando Python

### Windows
1. Ve a [python.org/downloads](https://python.org/downloads)
2. Descarga Python 3.x para Windows
3. **Marca** "Add Python to PATH" durante la instalación
4. Haz clic en Instalar

Verifica la instalación:
```bash
python --version
```

### macOS
```bash
# Usando Homebrew
brew install python3

# Verificar
python3 --version
```

### Linux
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip

# Verificar
python3 --version
```

> [!NOTE]
> En macOS y Linux, escribe `python3` en lugar de `python`. En Windows, solo `python` funciona.

## Eligiendo un Editor de Código

### VS Code (Recomendado)
1. Descárgalo de [code.visualstudio.com](https://code.visualstudio.com)
2. Instala la **extensión Python** de Microsoft
3. Instala el servidor de lenguaje **Pylance**

### PyCharm
Un IDE construido específicamente para Python, disponible en ediciones gratuita (Community) y de pago (Professional).

## Tu Primer Archivo Python

Crea un archivo llamado `hello.py`:

```python
# Esto es un comentario
print("Hello, World!")
name = input("What is your name? ")
print(f"Nice to meet you, {name}!")
```

Ejecútalo:
```bash
python hello.py
```

## Usando el REPL de Python

El REPL (Read-Eval-Print Loop) te permite probar código interactivamente:

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

## Trabajando con pip

pip es el gestor de paquetes de Python:

```bash
# Instalar un paquete
pip install requests

# Listar paquetes instalados
pip list

# Instalar desde un archivo requirements
pip install -r requirements.txt
```

## Entornos Virtuales (Básico)

Aísla las dependencias del proyecto:

```bash
# Crear un entorno virtual
python -m venv myenv

# Activarlo (Windows)
myenv\Scripts\activate

# Activarlo (macOS/Linux)
source myenv/bin/activate
```

> [!WARNING]
> ¡Usa siempre entornos virtuales para tus proyectos para evitar conflictos de dependencias!

## Convenciones de Estructura de Proyectos

```
my-project/
├── main.py
├── requirements.txt
├── README.md
└── myenv/          # Entorno virtual (no incluir en el repositorio)
```

> [!SUCCESS]
> Un buen editor con la extensión Python te brinda: resaltado de sintaxis, autocompletado, verificación de errores y depuración — todo esencial para programar productivamente.

## Preguntas de Práctica

1. ¿Qué comando verifica tu instalación de Python?
2. ¿Para qué se usa el REPL de Python?
3. ¿Qué hace `pip install requests`?
4. ¿Por qué deberías usar entornos virtuales?
5. ¿Cómo activas un entorno virtual en Linux?
6. ¿Qué extensión deberías instalar en VS Code para Python?
7. ¿Cuál es la diferencia entre un IDE y un editor de texto?
8. ¿Cómo sales del REPL de Python?
9. ¿Qué muestra `pip list`?
10. Crea un comando que instale todos los paquetes desde un archivo requirements.
