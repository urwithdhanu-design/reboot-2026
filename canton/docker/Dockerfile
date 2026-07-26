FROM digitalasset/daml-sdk:2.9.3 AS build
WORKDIR /build
COPY daml/ .
RUN daml build

FROM digitalasset/daml-sdk:2.9.3
WORKDIR /sandbox
COPY --from=build /build/.daml/dist/gcul-policy-0.1.0.dar /sandbox/gcul-policy.dar
COPY docker/start-sandbox.sh /start-sandbox.sh
RUN sed 's/\r$//' /start-sandbox.sh > /sandbox/start.sh
EXPOSE 6865 7575
CMD ["bash", "/sandbox/start.sh"]
