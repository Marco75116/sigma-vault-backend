#!/bin/sh
# Trap SIGTERM and SIGINT
trap "exit" TERM INT

# Generate types from ABIs
sqd typegen

# Run codegen to generate TypeORM entities
sqd codegen

# Wait for 10 seconds
sleep 10

# Build the project
sqd build

# Wait for the build to complete
sleep 5

# Generate migrations
sqd migration:generate

# Check if .env file exists
if [ ! -f .env ]; then
    touch .env
fi

# Run sqd process which includes both processor and serve
exec sqd run .