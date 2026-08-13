# Dockerfile en la raíz del repo: construye SOLO el backend (subcarpeta backend/).
# Existe para que Railway/PaaS lo detecte sin depender del ajuste "Root Directory".
FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY backend/pom.xml .
COPY backend/src ./src
RUN apt-get update \
    && apt-get install -y --no-install-recommends maven \
    && rm -rf /var/lib/apt/lists/* \
    && mvn --batch-mode -DskipTests package

FROM eclipse-temurin:21-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 utqallya
WORKDIR /app
COPY --from=build /workspace/target/utqallya-backend.jar app.jar
USER utqallya
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
