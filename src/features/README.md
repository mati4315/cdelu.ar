Estructura por características (feature-based)

Este directorio organiza el código por dominios de negocio. Cada feature contiene sus capas internas:

- news/
  - news.routes.js → capa API (rutas)
  - news.controller.js → capa de orquestación (controlador fino)
  - news.service.js → capa de aplicación (reglas de negocio)
  - news.repository.js → capa de acceso a datos (SQL/DAO)

Beneficios:
- Favorece separación de responsabilidades y testeo unitario por capa.
- Facilita colaboración de equipos por dominio.
- Permite migrar una feature a microservicio sin reescribir lógica.


