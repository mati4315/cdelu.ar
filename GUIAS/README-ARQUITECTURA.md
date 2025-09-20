Arquitectura propuesta (Fastify)

- Capas:
  - API (rutas/controllers finos)
  - Servicios de aplicación (reglas de negocio, orquestación)
  - Dominio (entidades/valor si aplica)
  - Repositorios/DAO (acceso a datos MySQL)

- Organización por features:
  - `src/features/news/*` como piloto. Se recomienda migrar `auth`, `ads`, `lottery`, `survey` de forma incremental.

- Prácticas:
  - Validación con JSON Schema (actual).
  - Swagger/OpenAPI expuesto en `/api/v1/docs` (actual).
  - Testing: unit (servicios), integración (rutas), contratos (OpenAPI).
  - CI: lint + test + build.

- Infra:
  - Dockerfile para producción, docker-compose para dev.
  - Futuro: IaC (Terraform/Helm) si se despliega en cloud/K8s.

- Migraciones:
  - Estandarizar con una herramienta (Knex/Prisma). Actualmente existen scripts sueltos; se sugiere consolidar.


