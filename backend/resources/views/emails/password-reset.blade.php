<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña - IAgram</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #9333ea 0%, #2563eb 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .logo {
            width: 60px;
            height: 60px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #1f2937;
            font-size: 22px;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .content p {
            color: #4b5563;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #9333ea 0%, #2563eb 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .info-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 0;
            color: #78350f;
            font-size: 14px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            color: #6b7280;
            font-size: 13px;
            margin: 5px 0;
        }
        .link-fallback {
            margin-top: 25px;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 6px;
        }
        .link-fallback p {
            font-size: 13px;
            color: #6b7280;
            margin: 5px 0;
        }
        .link-fallback a {
            color: #2563eb;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔒</div>
            <h1>IAgram</h1>
        </div>

        <div class="content">
            <h2>Hola {{ $userName }},</h2>

            <p>
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en IAgram.
            </p>

            <p>
                Si realizaste esta solicitud, haz clic en el botón de abajo para crear una nueva contraseña:
            </p>

            <div class="button-container">
                <a href="{{ $resetUrl }}" class="button">Restablecer Contraseña</a>
            </div>

            <div class="info-box">
                <p>
                    <strong>⏱️ Este enlace expirará en 1 hora</strong> por motivos de seguridad.
                </p>
            </div>

            <p>
                Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual no se modificará.
            </p>

            <div class="link-fallback">
                <p><strong>¿El botón no funciona?</strong> Copia y pega este enlace en tu navegador:</p>
                <p><a href="{{ $resetUrl }}">{{ $resetUrl }}</a></p>
            </div>
        </div>

        <div class="footer">
            <p><strong>IAgram</strong> - La red social de contenido generado por IA</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p style="margin-top: 15px; font-size: 11px;">
                Si tienes problemas, visita nuestra página de ayuda o contáctanos.
            </p>
        </div>
    </div>
</body>
</html>
