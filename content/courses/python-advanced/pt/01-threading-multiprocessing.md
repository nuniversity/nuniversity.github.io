---
title: "Threading, Multiprocessamento e Concorrência"
description: "Domine concorrência CPU-bound vs I/O-bound, o GIL, pools de threads/processos, locks, filas e estado compartilhado"
order: 1
duration: "90 minutos"
difficulty: avançado
---

# Threading, Multiprocessamento e Concorrência

## Concorrência vs Paralelismo

Concorrência é a composição de tarefas executadas independentemente; paralelismo é a execução simultânea de múltiplas computações. O módulo `threading` do Python fornece concorrência (mas paralelismo limitado devido ao GIL), enquanto `multiprocessing` fornece verdadeiro paralelismo via processos separados.

```mermaid
flowchart LR
    subgraph CONCORRENTE["Concorrente (Threading)"]
        T1[Tarefa A] --> T2[Tarefa B]
        T2 --> T1
    end
    subgraph PARALELO["Paralelo (Multiprocessing)"]
        P1[Processo 1] -.-> P2[Processo 2]
        P1 -.-> P3[Processo 3]
    end
```

## O Global Interpreter Lock (GIL)

O GIL é um mutex que protege os internos do CPython de condições de corrida. Garante que apenas uma thread execute bytecode Python por vez.

```python
import sys
print(sys._is_gil_enabled())  # Geralmente True para CPython
```

[!WARNING]
O GIL significa que trabalho CPU-bound em Python puro em threads é **serializado**. Para tarefas CPU-bound, use `multiprocessing`; para tarefas I/O-bound, threads são perfeitamente adequadas.

### Quando o GIL é liberado

Extensões C (como NumPy, `time.sleep()` ou operações de E/S) liberam o GIL, permitindo verdadeiro paralelismo durante essas chamadas:

```python
import threading
import time

def io_heavy():
    for _ in range(5):
        time.sleep(0.1)  # GIL liberado durante o sleep
        print(".", end="")

threads = [threading.Thread(target=io_heavy) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
```

## ThreadPoolExecutor

O `concurrent.futures.ThreadPoolExecutor` gerencia um pool de threads trabalhadoras para tarefas I/O-bound.

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

URLS = [
    "https://httpbin.org/delay/1",
    "https://httpbin.org/delay/2",
    "https://httpbin.org/delay/3",
]

def fetch(url):
    resp = requests.get(url)
    return url, resp.status_code, len(resp.text)

with ThreadPoolExecutor(max_workers=5) as pool:
    fut_map = {pool.submit(fetch, u): u for u in URLS}
    for future in as_completed(fut_map):
        url, status, size = future.result()
        print(f"{url} → {status} ({size}B)")
```

[!SUCCESS]
`ThreadPoolExecutor` é ideal para web scraping, consultas a banco de dados, E/S de arquivos e qualquer carga de trabalho I/O-bound.

## ProcessPoolExecutor

Para trabalho CPU-bound, use `ProcessPoolExecutor` — ele contorna o GIL ao criar processos separados.

```python
from concurrent.futures import ProcessPoolExecutor, as_completed
import math

PRIMES = [
    112272535095293,
    112582705942171,
    112272535095293,
    115280095190773,
    115797848077099,
    1099726899285419,
]

def is_prime(n):
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    sqrt_n = int(math.isqrt(n))
    for i in range(3, sqrt_n + 1, 2):
        if n % i == 0:
            return False
    return True

with ProcessPoolExecutor(max_workers=4) as pool:
    fut_map = {pool.submit(is_prime, p): p for p in PRIMES}
    for future in as_completed(fut_map):
        n = fut_map[future]
        print(f"{n} is prime: {future.result()}")
```

[!NOTE]
Cada processo tem seu próprio espaço de memória — você não pode compartilhar objetos Python diretamente. Use `multiprocessing.Queue`, `multiprocessing.Array` ou `Manager` para comunicação entre processos.

## Threading de Baixo Nível: Locks e Filas

### Segurança de Thread com `threading.Lock`

```python
import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter
    for _ in range(100_000):
        with lock:
            counter += 1

threads = [threading.Thread(target=increment) for _ in range(10)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)  # 1_000_000 (correto com lock)
```

### Usando `queue.Queue`

```python
from queue import Queue
import threading
import time

def producer(q):
    for i in range(10):
        q.put(f"item-{i}")
        time.sleep(0.05)

def consumer(q):
    while True:
        item = q.get()
        if item is None:
            break
        print(f"Consumed {item}")
        q.task_done()

q = Queue(maxsize=5)
prod = threading.Thread(target=producer, args=(q,))
cons = threading.Thread(target=consumer, args=(q,))

prod.start(); cons.start()
prod.join()
q.put(None)  # Sentinel
cons.join()
```

## Comunicação entre Processos

```python
from multiprocessing import Process, Queue

def worker(q):
    q.put("hello from child")

q = Queue()
p = Process(target=worker, args=(q,))
p.start()
print(q.get())  # "hello from child"
p.join()
```

### Memória Compartilhada com `Value` e `Array`

```python
from multiprocessing import Process, Value, Array

def increment(n, arr):
    n.value += 1
    for i in range(len(arr)):
        arr[i] *= 2

num = Value("i", 0)
data = Array("d", [1.0, 2.0, 3.0])
p = Process(target=increment, args=(num, data))
p.start()
p.join()
print(num.value)  # 1
print(data[:])    # [2.0, 4.0, 6.0]
```

## Primitivas de Sincronização

| Primitiva | Propósito | Módulo |
|-----------|-----------|--------|
| `Lock` | Exclusão mútua | `threading`, `multiprocessing` |
| `RLock` | Lock reentrante | `threading` |
| `Semaphore` | Limitar acesso concorrente a N workers | `threading`, `multiprocessing` |
| `Event` | Sinal entre threads | `threading` |
| `Condition` | Sinalização complexa entre threads | `threading` |
| `Barrier` | Aguardar N threads se encontrarem | `threading` |

## Caso de Uso Real: Web Scraper Concorrente

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
from collections import Counter

SEED = "https://example.com"
MAX_DEPTH = 2
MAX_WORKERS = 10

visited = set()
word_counts = Counter()

def scrape_page(url, depth):
    if url in visited or depth > MAX_DEPTH:
        return []
    visited.add(url)
    try:
        resp = requests.get(url, timeout=5)
    except Exception:
        return []
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup.find_all(["h1", "h2", "h3", "p"]):
        word_counts.update(tag.get_text().lower().split())
    links = []
    for a in soup.find_all("a", href=True):
        full = urljoin(url, a["href"])
        if full.startswith("http"):
            links.append((full, depth + 1))
    return links

with ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
    futures = [pool.submit(scrape_page, SEED, 0)]
    while futures:
        for f in as_completed(futures):
            futures.remove(f)
            new_links = f.result()
            for link, d in new_links[:20]:
                futures.append(pool.submit(scrape_page, link, d))
```

## Comparação de Desempenho

```mermaid
flowchart TD
    subgraph IO_BOUND["I/O-Bound (ex.: chamadas HTTP)"]
        t1["Sequencial: 10s"] --> t2["ThreadPoolExecutor: 1.2s"]
        t2 --> t3["ProcessPoolExecutor: 1.3s"]
    end
    subgraph CPU_BOUND["CPU-Bound (ex.: crivo de primos)"]
        p1["Sequencial: 10s"] --> p2["ThreadPoolExecutor: 9.8s (GIL)"]
        p2 --> p3["ProcessPoolExecutor: 2.6s ✓"]
    end
```

## Perguntas de Prática

1. O que é o GIL e por que ele existe? Quando ele é liberado?
2. Você tem uma lista de 10.000 URLs para baixar. Usaria `ThreadPoolExecutor` ou `ProcessPoolExecutor`? Por quê?
3. Escreva um programa que calcula a soma dos quadrados dos números 1–10⁷ usando `ProcessPoolExecutor` e compara a velocidade com execução single-threaded.
4. O que acontece se duas threads chamam `counter += 1` simultaneamente sem um lock? Ilustre com um exemplo.
5. Como `queue.Queue` difere de `multiprocessing.Queue`? Quando você usaria cada um?
6. Implemente um padrão produtor-consumidor onde três produtores geram dados e dois consumidores os processam, usando `threading` e `queue`.
7. Por que `ProcessPoolExecutor` pode ser mais lento que single-threaded para tarefas muito pequenas? Como você ajustaria isso?
8. O que é um valor sentinela e como é usado para sinalizar a um trabalhador para parar?
9. Escreva um programa que usa `multiprocessing.Pool.map` para paralelizar uma função pesada de CPU.
10. Explique a diferença entre concorrência e paralelismo em Python. Dê um exemplo real de cada.
