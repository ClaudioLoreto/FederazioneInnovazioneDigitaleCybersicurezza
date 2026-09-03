# =============================================================================
#  Dockerfile — build & run dell'API FIDC (usato anche dal deploy Railway).
#  Multi-stage: SDK per build, runtime ASP.NET per l'immagine finale leggera.
#  In Railway impostare le variabili d'ambiente:
#    Database__Provider=Postgres
#    ConnectionStrings__Postgres=<DATABASE_URL di Railway in formato Npgsql>
#    Jwt__Key, Resend__ApiKey, ...
# =============================================================================

# ---- Stage 1: build -----------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia i .csproj prima per sfruttare la cache di restore
COPY backend/FIDC.Models/FIDC.Models.csproj FIDC.Models/
COPY backend/FIDC.Dal/FIDC.Dal.csproj       FIDC.Dal/
COPY backend/FIDC.Bll/FIDC.Bll.csproj       FIDC.Bll/
COPY backend/FIDC.Api/FIDC.Api.csproj       FIDC.Api/
RUN dotnet restore FIDC.Api/FIDC.Api.csproj

# Copia il resto del codice e pubblica in Release
COPY backend/ .
RUN dotnet publish FIDC.Api/FIDC.Api.csproj -c Release -o /app/publish

# ---- Stage 2: runtime ---------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Railway inietta la variabile PORT: l'app ascolta su 0.0.0.0:$PORT
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "FIDC.Api.dll"]
