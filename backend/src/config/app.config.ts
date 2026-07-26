export const appConfig = {
  name: process.env.APP_NAME ?? 'LeadsZ',
  apiTitle: process.env.API_TITLE ?? 'LeadsZ API',
  swaggerDescription:
    process.env.SWAGGER_DESCRIPTION ?? 'API documentation for LeadsZ',
  port: Number(process.env.PORT ?? 3001),
  apiVersion: process.env.API_VERSION ?? 'v0',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  logoUrl:
    process.env.APP_LOGO_URL ??
    'https://res.cloudinary.com/dh39ahmpj/image/upload/v1785066171/app-icon_krffrs.png',
  iconUrl:
    process.env.APP_ICON_URL ??
    'https://res.cloudinary.com/dh39ahmpj/image/upload/v1785066171/app-icon_krffrs.png',
  wordmarkUrl:
    process.env.APP_WORDMARK_URL ??
    'https://res.cloudinary.com/dh39ahmpj/image/upload/v1785066171/workdmark_nf2gw9.png',
};
