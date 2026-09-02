export const metadata = { title: "Términos y Condiciones — Finanzas" };

const LAST_UPDATED = "1 de septiembre de 2026";

export default function TermsPage() {
  return (
    <>
      <h1>Términos y Condiciones</h1>
      <p>Última actualización: {LAST_UPDATED}</p>

      <p>
        Este documento es un borrador estándar redactado para el lanzamiento inicial de
        Finanzas. Antes de cobrar a usuarios reales se recomienda que un abogado lo revise y lo
        ajuste a la normativa colombiana vigente (Ley 1581 de 2012 de protección de datos, Ley
        527 de 1999 de comercio electrónico, Estatuto del Consumidor, y cualquier regulación
        aplicable a servicios financieros informativos).
      </p>

      <h2>1. Aceptación de los términos</h2>
      <p>
        Al crear una cuenta en Finanzas (&quot;el Servicio&quot;) aceptas estos Términos y
        Condiciones y nuestra <a href="/legal/privacidad">Política de Privacidad</a>. Si no
        estás de acuerdo, no debes usar el Servicio.
      </p>

      <h2>2. Descripción del Servicio</h2>
      <p>
        Finanzas es una herramienta de gestión de finanzas personales: seguimiento de deudas,
        cuentas, ingresos y gastos, metas de ahorro, proyecciones y recomendaciones. El Servicio
        es una herramienta de organización y no constituye asesoría financiera, contable,
        tributaria ni de inversión profesional. Las proyecciones, simulaciones y recomendaciones
        que genera son estimaciones basadas en la información que tú mismo ingresas y no
        garantizan resultados.
      </p>

      <h2>3. Cuentas de usuario</h2>
      <p>
        Eres responsable de mantener la confidencialidad de tu contraseña y de toda la actividad
        que ocurra en tu cuenta. Debes notificarnos de inmediato si sospechas un acceso no
        autorizado. Debes tener al menos 18 años para usar el Servicio.
      </p>

      <h2>4. Planes y pagos</h2>
      <p>
        Algunas funciones del Servicio requieren una suscripción paga. Los precios, la
        periodicidad de cobro y los medios de pago disponibles se muestran antes de confirmar
        la suscripción.
      </p>
      <p>
        <strong>Renovación automática:</strong> la suscripción se renueva automáticamente al
        final de cada período (mensual o anual) y se cobra a la misma tarjeta registrada, salvo
        que la canceles. Debes cancelarla con al menos <strong>3 días de anticipación</strong> a
        la fecha de cobro para evitar el próximo cargo; si cancelas después de ese plazo, el
        cobro ya programado podría procesarse igual. Puedes cancelar en cualquier momento desde
        Perfil → Suscripción; la cancelación aplica al final del período ya pagado, salvo que la
        ley aplicable exija un reembolso proporcional.
      </p>

      <h2>5. Tus datos financieros</h2>
      <p>
        La información que registras (saldos, deudas, ingresos, gastos) es tuya. La usamos
        únicamente para operar el Servicio y mostrártela a ti — no la vendemos ni la compartimos
        con terceros con fines comerciales. Más detalles en la{" "}
        <a href="/legal/privacidad">Política de Privacidad</a>.
      </p>

      <h2>6. Suspensión y cancelación de cuenta</h2>
      <p>
        Puedes suspender o eliminar tu cuenta cuando quieras desde Configuración. Nos
        reservamos el derecho de suspender cuentas que incumplan estos términos, incluyendo uso
        fraudulento del Servicio o de la pasarela de pagos.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        El Servicio se ofrece &quot;tal cual&quot;. No garantizamos que esté libre de errores o
        interrupciones. En la medida permitida por la ley, no somos responsables por decisiones
        financieras que tomes basándote en la información o proyecciones del Servicio.
      </p>

      <h2>8. Cambios a estos términos</h2>
      <p>
        Podemos actualizar estos términos. Si el cambio es significativo, te avisaremos por
        correo o dentro de la aplicación antes de que entre en vigencia.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para preguntas sobre estos términos, escribe al correo de soporte indicado en la
        aplicación.
      </p>
    </>
  );
}
