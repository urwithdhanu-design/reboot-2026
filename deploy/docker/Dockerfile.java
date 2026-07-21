# syntax=docker/dockerfile:1
ARG SERVICE_DIR
FROM eclipse-temurin:17-jdk-alpine AS build
ARG SERVICE_DIR
WORKDIR /build
COPY ${SERVICE_DIR}/mvnw ./mvnw
COPY ${SERVICE_DIR}/.mvn ./.mvn
COPY ${SERVICE_DIR}/pom.xml ./pom.xml
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline -DskipTests
COPY ${SERVICE_DIR}/src ./src
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /build/target/*.jar /app/app.jar
ENV JAVA_OPTS=""
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
