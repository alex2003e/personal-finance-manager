export const metadata = { title: "Política de Privacidad — Finanzas" };

const LAST_UPDATED = "1 de septiembre de 2026";

export default function PrivacyPage() {
  return (
    <>
      <h1>Política de Privacidad</h1>
      <p>Última actualización: {LAST_UPDATED}</p>

      <p>
        Este documento es un borrador estándar redactado para el lanzamiento inicial de
        Finanzas, alineado en principio con la Ley 1581 de 2012 (Régimen General de Protección
        de Datos Personales de Colombia). Antes de operar con usuarios reales se recomienda que
        un abogado la revise y, si aplica, se registre la base de datos ante la Superintendencia
        de Industria y Comercio (SIC).
      </p>

      <h2>1. Qué datos recopilamos</h2>
      <ul>
        <li>Datos de cuenta: nombre, correo, contraseña (cifrada), foto de perfil (opcional).</li>
        <li>
          Datos financieros que registras tú mismo: deudas, cuentas, movimientos, metas, activos
          — necesarios para que el Servicio funcione.
        </li>
        <li>
          Datos de pago: si contratas un plan pago, el procesamiento de la tarjeta lo hace
          nuestra pasarela de pagos (Stripe); nosotros no almacenamos el número completo de tu
          tarjeta.
        </li>
        <li>Datos técnicos básicos: dirección IP y registros de uso, para seguridad y soporte.</li>
      </ul>

      <h2>2. Para qué usamos tus datos</h2>
      <ul>
        <li>Operar el Servicio y mostrarte tu propia información.</li>
        <li>Enviarte correos de verificación, recuperación de contraseña y alertas que actives.</li>
        <li>Procesar pagos de tu suscripción.</li>
        <li>Mejorar el Servicio y prevenir fraude o abuso.</li>
      </ul>
      <p>No vendemos tus datos ni los compartimos con terceros con fines publicitarios.</p>

      <h2>3. Con quién compartimos datos</h2>
      <p>
        Solo con proveedores necesarios para operar el Servicio: hosting (Vercel), base de datos
        (Neon), envío de correo (Google/Gmail) y procesamiento de pagos (Stripe), cada uno sujeto
        a sus propias políticas de seguridad.
      </p>

      <h2>4. Tus derechos</h2>
      <p>
        Puedes acceder, actualizar o eliminar tu información desde la sección de Perfil y
        Configuración en cualquier momento. También puedes solicitar la eliminación completa de
        tu cuenta y datos escribiendo al correo de soporte indicado en la aplicación.
      </p>

      <h2>5. Seguridad</h2>
      <p>
        Las contraseñas se almacenan cifradas (nunca en texto plano). El acceso a tu cuenta
        requiere verificación de correo. Aun así, ningún sistema es 100% infalible; te
        recomendamos usar una contraseña única para este servicio.
      </p>

      <h2>6. Retención de datos</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Si suspendes o eliminas tu cuenta,
        conservamos la información el tiempo mínimo necesario por obligaciones legales
        (por ejemplo, registros de facturación) y luego la eliminamos.
      </p>

      <h2>7. Cambios a esta política</h2>
      <p>
        Si hacemos cambios significativos, te avisaremos por correo o dentro de la aplicación
        antes de que entren en vigencia.
      </p>

      <h2>8. Contacto</h2>
      <p>
        Para ejercer tus derechos o preguntas sobre esta política, escribe al correo de soporte
        indicado en la aplicación.
      </p>
    </>
  );
}
