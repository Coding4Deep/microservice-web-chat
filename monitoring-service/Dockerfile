FROM tomcat:10.1-jre17-temurin-jammy
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN rm -rf /usr/local/tomcat/webapps/*
COPY target/monitoring.war /usr/local/tomcat/webapps/monitoring.war
RUN chown -R appuser:appuser /usr/local/tomcat
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/monitoring/health || exit 1
CMD ["catalina.sh", "run"]
