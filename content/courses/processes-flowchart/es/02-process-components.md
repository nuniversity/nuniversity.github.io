---
title: "Componentes del proceso"
description: "Aprenda sobre los bloques de construcción fundamentales de cualquier proceso: entradas, salidas, transformaciones, puntos de decisión, actores y controles."
order: 2
duration: "35 min"
difficulty: "beginner"
---

# Componentes del proceso

Todo proceso, por simple o complejo que sea, se construye a partir de un conjunto de componentes fundamentales. Entender estos componentes es esencial para analizar, documentar y mejorar procesos. En esta lección, desglosaremos cada componente y veremos cómo trabajan juntos.

## Los cinco componentes fundamentales

Todos los procesos consisten en cinco elementos fundamentales:

1. **Entradas**: Recursos que entran en el proceso
2. **Transformaciones**: Acciones que modifican las entradas
3. **Salidas**: Resultados que salen del proceso
4. **Puntos de decisión**: Lugares donde el proceso se ramifica
5. **Actores**: Entidades que realizan las acciones

```mermaid
flowchart LR
    I[/"Entradas: Recursos, Datos, Materiales"/] --> T[Transformaciones: Acciones, Operaciones]
    T --> D{Puntos de decisión: Condiciones, Reglas}
    D -->|Camino A| T2[Transformaciones adicionales]
    D -->|Camino B| T3[Transformaciones alternativas]
    T2 --> O[/"Salidas: Productos, Resultados, Datos"/]
    T3 --> O
    
    A[Actores: Personas, Sistemas, Equipos] -.-> T
    A -.-> D
    A -.-> T2
    A -.-> T3
    
    style I fill:#E3F2FD
    style O fill:#E8F5E9
    style D fill:#FFF3E0
    style A fill:#F3E5F5
```

## 1. Entradas

Las entradas son todo lo que un proceso necesita para iniciar y funcionar. Pueden ser tangibles o intangibles.

### Tipos de entradas

| Tipo | Descripción | Ejemplos |
|---|---|---|
| **Material** | Recursos físicos | Materia prima, documentación, hardware |
| **Información** | Datos o conocimiento | Solicitud del cliente, especificaciones, requisitos |
| **Energía** | Fuerza para impulsar el proceso | Electricidad, esfuerzo humano, recursos de cómputo |
| **Tiempo** | Duración asignada | Plazos, SLAs, ventanas programadas |

### La calidad de las entradas importa

> [!WARNING] Basura entra, basura sale
> La calidad de tus salidas está directamente limitada por la calidad de tus entradas. Un proceso no puede producir resultados de alta calidad a partir de entradas de baja calidad.

```mermaid
flowchart TD
    A[/"Formulario de pedido del cliente"/] --> B{¿El formulario está completo?}
    B -->|No| C[/"Devolver para completarlo"/]
    B -->|Sí| D[/"Datos válidos del pedido"/]
    D --> E[Procesar el pedido]
    
    style A fill:#FFCDD2
    style C fill:#FFCDD2
    style D fill:#C8E6C9
```

### Ejemplo real: las entradas de una cocina de restaurante

```
Entradas para un pedido de pizza:
├── Material: masa, salsa, queso, ingredientes extra
├── Información: pedido del cliente (tamaño, tipo, extras)
├── Energía: calor del horno, trabajo del chef
└── Tiempo: ventana de preparación de 15-20 minutos
```

## 2. Transformaciones

Las transformaciones son las acciones que convierten las entradas en salidas. Son el "trabajo" del proceso.

### Tipos de transformaciones

| Tipo | Descripción | Ejemplo |
|---|---|---|
| **Física** | Cambiar forma o estado | Cortar, ensamblar, cocinar |
| **Informacional** | Cambiar datos o conocimiento | Calcular, traducir, analizar |
| **De ubicación** | Cambiar la posición | Enviar, enrutar, transferir |
| **Transaccional** | Cambiar la propiedad o el estado | Aprobar, comprar, registrar |

### Ejemplo de transformación: el proceso de revisión de código

```mermaid
flowchart TD
    A[/"Pull Request"/] --> B[Linting automatizado]
    B --> C[/"Informe de lint"/]
    C --> D{¿Pasó el lint?}
    D -->|No| E[/"Corregir los problemas del código"/]
    D -->|Sí| F[Revisión manual de código]
    E --> B
    F --> G{¿El revisor aprueba?}
    G -->|No| H[/"Atender los comentarios"/]
    G -->|Sí| I[/"PR aprobado"/]
    H --> F
    
    style A fill:#BBDEFB
    style I fill:#C8E6C9
    style D fill:#FFF3E0
    style G fill:#FFF3E0
```

### Mejores prácticas para las transformaciones

> [!TIP] Mantén las transformaciones atómicas
> Cada paso de transformación debe hacer **una sola cosa bien**. Si un paso hace varias cosas, considera dividirlo en pasos más pequeños. Esto hace que los procesos sean más fáciles de entender, probar y mejorar.

## 3. Salidas

Las salidas son los resultados producidos por el proceso. Pueden ser el entregable principal o subproductos secundarios.

### Salidas primarias vs. secundarias

| Tipo | Descripción | Ejemplo (compilación de software) |
|---|---|---|
| **Primaria** | El resultado principal que se busca | Binario de la aplicación compilada |
| **Secundaria** | Resultados útiles adicionales | Registros de compilación, informes de prueba, artefactos |
| **Residuos** | Subproductos no deseados | Archivos temporales, compilaciones fallidas |

### Validación de las salidas

Todo proceso debe validar sus salidas antes de completarse:

```mermaid
flowchart TD
    A[Transformación completada] --> B[Validar la salida]
    B --> C{¿Cumple los criterios de calidad?}
    C -->|No| D[Manejar la excepción]
    C -->|Sí| E[/"Entregar la salida"/]
    D --> F{¿Se puede corregir?}
    F -->|Sí| G[Reintentar la transformación]
    F -->|No| H[/"Escalar el error"/]
    G --> B
    
    style E fill:#C8E6C9
    style H fill:#FFCDD2
    style C fill:#FFF3E0
    style F fill:#FFF3E0
```

## 4. Puntos de decisión

Los puntos de decisión son el lugar donde un proceso evalúa condiciones y elige entre diferentes caminos.

### Patrones de puntos de decisión

#### Patrón 1: decisión binaria

```mermaid
flowchart TD
    A[Paso del proceso] --> B{¿Se cumple la condición?}
    B -->|Sí| C[Continuar por el camino A]
    B -->|No| D[Continuar por el camino B]
    
    style B fill:#FFE0B2
```

#### Patrón 2: decisión múltiple

```mermaid
flowchart TD
    A[Recibir la solicitud] --> B{¿Tipo de solicitud?}
    B -->|Error| C[Enviar a la cola de errores]
    B -->|Función| D[Enviar a la cola de funciones]
    B -->|Pregunta| E[Enviar al FAQ]
    
    style B fill:#FFE0B2
```

#### Patrón 3: decisión en bucle

```mermaid
flowchart TD
    A[Procesar elemento] --> B{¿Más elementos?}
    B -->|Sí| A
    B -->|No| C[Continuar con el siguiente paso]
    
    style B fill:#FFE0B2
```

### Mejores prácticas para los puntos de decisión

| Práctica | Por qué importa |
|---|---|
| **Criterios claros** | Todos deben entender cuándo se toma cada camino |
| **Reglas documentadas** | La lógica de decisión debe ser explícita, no implícita |
| **Caminos de respaldo** | Define siempre qué sucede cuando ninguna condición coincide |
| **Rastro de auditoría** | Registra qué camino se tomó y por qué |

> [!NOTE] Advertencia sobre la complejidad de las decisiones
> Si un punto de decisión tiene más de 4-5 ramificaciones, considera si el proceso puede simplificarse. Las decisiones complejas suelen indicar que un proceso debe dividirse en subprocesos.

## 5. Actores

Los actores son las entidades que realizan el trabajo en un proceso. Pueden ser humanos o automatizados.

### Tipos de actores

| Tipo | Descripción | Ejemplos |
|---|---|---|
| **Humano** | Personas que realizan tareas | Desarrollador, gerente, cliente |
| **Sistema** | Software que realiza tareas | Servidor de CI, base de datos, API |
| **Híbrido** | Una persona que usa un sistema | Analista que usa un panel |
| **Externo** | Fuera de la organización | Pasarela de pago, transportista |

### Matriz de responsabilidades de los actores

```mermaid
flowchart LR
    subgraph Actores
        A[Cliente]
        B[Agente de soporte]
        C[Sistema automatizado]
        D[Gerente]
    end
    
    subgraph Responsabilidades
        A --> R1[Enviar la solicitud]
        B --> R2[Investigar el problema]
        C --> R3[Enrutar y escalar]
        D --> R4[Aprobar excepciones]
    end
    
    style A fill:#E1F5FE
    style B fill:#F3E5F5
    style C fill:#E8F5E9
    style D fill:#FFF3E0
```

### Modelo RACI para los actores de un proceso

El modelo RACI ayuda a aclarar las responsabilidades de los actores:

| Rol | Significado | Ejemplo en una revisión de código |
|---|---|---|
| **R**esponsable | Realiza el trabajo | Desarrollador que escribe el código |
| **A**ccountable | Responde por el resultado | Líder técnico que aprueba los cambios |
| **C**onsultado | Aporta información | Equipo de seguridad que revisa |
| **I**nformado | Se mantiene al tanto | Gerente de proyecto que recibe el aviso |

## Poniéndolo todo junto: ejemplo completo de proceso

Examinemos un proceso completo con los cinco componentes:

### Proceso de solicitud de una función de software

```mermaid
flowchart TD
    subgraph Entradas
        I1[/"Solicitud de función del usuario"/]
        I2[/"Requisitos de negocio"/]
        I3[/"Restricciones técnicas"/]
    end
    
    subgraph Actores
        A1[Gerente de producto]
        A2[Equipo de ingeniería]
        A3[Equipo de QA]
    end
    
    I1 --> A1
    A1 --> D1{Evaluación de prioridad}
    D1 -->|Alta| P1[Agregar al sprint actual]
    D1 -->|Media| P2[Agregar al backlog]
    D1 -->|Baja| P3[Archivar para revisión]
    
    P1 --> A2
    A2 --> T1[Diseñar la solución]
    T1 --> T2[Implementar el código]
    T2 --> T3[Escribir las pruebas]
    T3 --> A3
    A3 --> D2{¿Las pruebas pasan?}
    D2 -->|Sí| O1[/"Función desplegada"/]
    D2 -->|No| T2
    
    I2 -.-> D1
    I3 -.-> T1
    
    style I1 fill:#BBDEFB
    style I2 fill:#BBDEFB
    style I3 fill:#BBDEFB
    style O1 fill:#C8E6C9
    style D1 fill:#FFE0B2
    style D2 fill:#FFE0B2
```

## Ejercicios prácticos

### Ejercicio 1: Identificación de componentes

Para el proceso de "retirar dinero de un cajero automático", identifica:
1. Todas las entradas
2. Todas las transformaciones
3. Todas las salidas
4. Todos los puntos de decisión
5. Todos los actores

### Ejercicio 2: Dibuja un proceso

Dibuja un diagrama de flujo para el proceso de "publicar una entrada de blog" que incluya:
- Al menos 3 entradas
- Al menos 4 transformaciones
- Al menos 2 puntos de decisión
- Al menos 2 actores diferentes
- Salidas claras

### Ejercicio 3: Analiza un proceso roto

Considera este proceso problemático:
```
Queja del cliente → Enviarla al departamento → El departamento la resuelve → Listo
```

Identifica lo que falta:
- ¿Están claramente definidas las entradas?
- ¿Hay puntos de decisión para el enrutamiento?
- ¿Hay validación de la salida?
- ¿Quiénes son los actores?

<details>
<summary>Haz clic para ver el análisis</summary>

**Problemas identificados:**
- Sin validación de la entrada (¿está completa la queja?)
- Sin puntos de decisión (¿y si la recibe el departamento equivocado?)
- Sin validación de la salida (¿quedó satisfecho el cliente?)
- Los actores son vagos ("departamento" no es específico)
- Sin camino de escalación si el departamento no responde
- Sin bucle de retroalimentación para la mejora

</details>

## Conclusiones Clave (Key Takeaways)

- Todo proceso tiene **cinco componentes fundamentales**: entradas, transformaciones, salidas, puntos de decisión y actores
- La **calidad de las entradas** determina directamente la calidad de las salidas
- Las **transformaciones** deben ser atómicas: una cosa por paso
- Los **puntos de decisión** deben tener criterios claros y documentados
- Los **actores** necesitan responsabilidades bien definidas (usa RACI)
- Entender los componentes facilita **analizar** y **mejorar** cualquier proceso

> [!SUCCESS] Has completado la lección 2
> Ahora entiendes los bloques de construcción de todo proceso. En la próxima lección, exploraremos los **diagramas de flujo**: el lenguaje visual que se usa para documentar y comunicar procesos.
