---
title: "Programación Declarativa: SQL y HCL"
description: "Aprende el paradigma declarativo: describe lo que quieres, no cómo obtenerlo — usando SQL y HCL"
order: 9
duration: "35 minutes"
difficulty: "intermediate"
---

# Programación Declarativa: SQL y HCL

Cada paradigma de programación que has visto hasta ahora es **imperativo**: escribes instrucciones paso a paso describiendo exactamente cómo lograr un resultado. La **programación declarativa** invierte esto: describes el resultado deseado, y el sistema descubre cómo llegar allí.

## Imperativo vs Declarativo

**Imperativo** (cómo):

```javascript
// Paso a paso: cómo encontrar usuarios mayores de 18
let resultado = [];
for (let i = 0; i < usuarios.length; i++) {
  if (usuarios[i].edad >= 18) {
    resultado.push(usuarios[i]);
  }
}
```

**Declarativo** (qué):

```sql
-- Describe lo que quieres, no cómo
SELECT * FROM usuarios WHERE edad >= 18;
```

No le dices a la base de datos cómo iterar, filtrar o recolectar resultados. Simplemente declaras lo que necesitas.

## SQL: Structured Query Language

SQL es el lenguaje declarativo más utilizado. Te permite consultar, insertar, actualizar y eliminar datos en bases de datos relacionales.

### SELECT — Recuperando Datos

```sql
SELECT nombre, edad FROM usuarios;
```

Esto devuelve las columnas `nombre` y `edad` para cada fila en la tabla `usuarios`.

### WHERE — Filtrando Filas

```sql
SELECT * FROM productos
WHERE precio < 50 AND categoria = 'Electrónicos';
```

### ORDER BY — Ordenando

```sql
SELECT nombre, salario FROM empleados
ORDER BY salario DESC;
```

### JOIN — Combinando Tablas

Los datos a menudo están dispersos en múltiples tablas. `JOIN` las conecta:

```sql
SELECT pedidos.id, clientes.nombre, pedidos.total
FROM pedidos
JOIN clientes ON pedidos.cliente_id = clientes.id
WHERE pedidos.total > 100;
```

Esta consulta responde: "¿Qué clientes hicieron pedidos de más de $100 y cuáles fueron los montos?" — sin escribir un solo bucle.

### INSERT, UPDATE, DELETE

```sql
-- Agregar un nuevo registro
INSERT INTO usuarios (nombre, email) VALUES ('Ana', 'ana@ejemplo.com');

-- Actualizar registros existentes
UPDATE usuarios SET edad = 31 WHERE nombre = 'Ana';

-- Eliminar registros
DELETE FROM usuarios WHERE edad < 18;
```

> [!NOTE]
> SQL es declarativa a nivel de sentencia, pero detrás de escena el motor de la base de datos crea un plan de ejecución — decide la mejor forma de ejecutar tu consulta.

## HCL: HashiCorp Configuration Language

HCL es utilizado por Terraform, una herramienta para gestionar infraestructura como código. Declaras qué infraestructura deseas, y Terraform la crea.

### Ejemplo con Terraform

```hcl
# Declarar una instancia EC2 de AWS
resource "aws_instance" "servidor_web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "ServidorWeb"
  }
}
```

Esto define una máquina virtual: la AMI (imagen), el tamaño de la instancia y las etiquetas. No escribes código para llamar APIs de nube, manejar errores o verificar estado — Terraform se encarga de todo eso.

### Variables y Salidas

```hcl
variable "region" {
  description = "Región AWS"
  default     = "us-east-1"
}

resource "aws_instance" "servidor" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.tipo_instancia
}

output "ip_publico" {
  value = aws_instance.servidor.public_ip
}
```

### La Ventaja Declarativa

Con Terraform, tu configuración de infraestructura es:
- **Versionada** — almacenada en Git junto con tu código
- **Reproducible** — misma configuración produce misma infraestructura
- **Autodocumentada** — el archivo de configuración describe exactamente lo que existe
- **Idempotente** — ejecutarlo de nuevo no hace cambios si nada está desactualizado

## Ejercicio Práctico

Escribe consultas SQL para una base de datos de tienda online:

```sql
-- 1. Encontrar todos los productos menores a $50
SELECT nombre, precio FROM productos WHERE precio < 50;

-- 2. Listar pedidos realizados en 2024 con nombres de clientes
SELECT clientes.nombre, pedidos.fecha, pedidos.total
FROM pedidos
JOIN clientes ON pedidos.cliente_id = clientes.id
WHERE pedidos.fecha >= '2024-01-01' AND pedidos.fecha < '2025-01-01'
ORDER BY pedidos.total DESC;

-- 3. Mostrar cuántos productos hay en cada categoría
SELECT categoria, COUNT(*) AS cantidad_productos
FROM productos
GROUP BY categoria
ORDER BY cantidad_productos DESC;
```

## Resumen

| Concepto | Imperativo | Declarativo |
|----------|------------|-------------|
| Enfoque | Cómo hacerlo | Qué obtener |
| Ejemplo SQL | Bucle + filtro | `SELECT ... WHERE` |
| Infraestructura | Llamadas API + scripts | `resource "tipo" "nombre" { }` |
| Beneficio clave | Control total | Simplicidad, legibilidad, idempotencia |

## Próximos Pasos

Has completado el curso. Aprendiste los fundamentos de la programación — variables, funciones, flujo de control y estructuras de datos — y exploraste tres paradigmas principales: funcional (Python), compilado (Rust) y declarativo (SQL/HCL). ¡Sigue practicando y construyendo!
