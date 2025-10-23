FROM tomcat:10.1-jdk17-openjdk-slim

# Remove default webapps
RUN rm -rf /usr/local/tomcat/webapps/*

# Copy the WAR file
COPY target/monitoring.war /usr/local/tomcat/webapps/monitoring.war

# Install Docker CLI for container monitoring
RUN apt-get update && \
    apt-get install -y docker.io procps && \
    rm -rf /var/lib/apt/lists/*

# Expose port
EXPOSE 8080

# Start Tomcat
CMD ["catalina.sh", "run"]
