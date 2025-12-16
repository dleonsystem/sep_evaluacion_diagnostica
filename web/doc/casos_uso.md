# Modelo de Casos de Uso – Plataforma EIA 2025–2026

## 1. Diagrama general de casos de uso (Mermaid)

```mermaid
flowchart LR
    subgraph Actores
        A[Director Escolar]
        B[Usuario SEP Estatal]
        C[Usuario SEP Federal]
        D[Administrador del Sistema]
    end

    subgraph Sistema[Plataforma EIA]
        CU1[CU-01 Iniciar sesión]
        CU2[CU-02 Cargar valoraciones]
        CU3[CU-05 Descargar valoraciones]
        CU4[CU-06 Cargar resultados]
        CU5[CU-07 Descargar resultados]
        CU6[CU-08 Consultar bitácora]
        CU7[CU-09 Gestionar usuarios]
    end

    A --> CU1
    B --> CU1
    C --> CU1
    D --> CU1

    A --> CU2
    A --> CU5

    B --> CU3
    C --> CU3
    C --> CU4

    D --> CU6
    D --> CU7
```

---

## 2. Lista de casos de uso

1. CU-01 Iniciar sesión  
2. CU-02 Cargar archivo de valoraciones  
3. CU-03 Validar estructura de archivo (extensión y campos obligatorios)  
4. CU-04 Mostrar advertencias de valoraciones incompletas  
5. CU-05 Descargar archivos de valoraciones (SEP)  
6. CU-06 Cargar archivos de resultados (SEP Federal)  
7. CU-07 Descargar resultados por escuela  
8. CU-08 Consultar bitácora de actividades  
9. CU-09 Gestionar usuarios (Administrador)  
10. CU-10 Cerrar sesión  

---

## 3. Relación con la SRS y casos detallados

- El detalle completo de cada caso de uso (pre/postcondiciones, flujos, reglas de negocio) se encuentra en `casos_uso_detallados.md`.
- La relación con los requerimientos funcionales de alto nivel se describe en `srs.md`.
