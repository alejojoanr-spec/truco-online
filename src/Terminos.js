export default function Terminos({ onVolver }) {
  return (
    <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at center,#1a472a 0%,#0a2414 50%,#050f08 100%)", padding:"32px 16px", fontFamily:"Georgia, serif", color:"#e2f5e9" }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>

        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:11,color:"#4ade80",letterSpacing:3,textTransform:"uppercase",marginBottom:4 }}>Truco</div>
          <div style={{ fontSize:28,color:"#fbbf24",fontWeight:900,lineHeight:1 }}>Online</div>
          <div style={{ width:60,height:2,background:"#2d6a4f",margin:"16px auto" }}></div>
          <div style={{ fontSize:20,color:"#e2f5e9",fontWeight:700 }}>Términos y Condiciones</div>
        </div>

        {[
          { titulo:"1. Registro como suscriptor", color:"#4ade80", texto:"Al completar el registro de una cuenta-usuario de Truco Online se convierte en suscriptor. No está permitido registrarse como suscriptor a los menores de 18 años de edad. La cuenta es personal, nominativa e intransferible. El suscriptor es responsable de la confidencialidad de su contraseña." },
          { titulo:"2. Permisos y restricciones", color:"#4ade80", texto:"El suscriptor tiene acceso a los contenidos y servicios para uso personal sin fines comerciales. No está permitido copiar, reproducir, distribuir ni modificar los contenidos sin consentimiento previo y escrito de Truco Online." },
          { titulo:"3. Facturación y pagos", color:"#4ade80", texto:"Todos los cargos son pagados por adelantado y son definitivos. Para cargar saldo se deberá transferir al CBU/CVU/ALIAS indicado. El saldo será acreditado automáticamente una vez verificada la transferencia." },
          { titulo:"4. Reembolsos", color:"#4ade80", texto:"Podés solicitar un reembolso comunicándote por email. El plazo de resolución es de 72hs hábiles. Los métodos disponibles son saldo en plataforma o transferencia bancaria. Productos digitales ya utilizados no son reembolsables." },
          { titulo:"⚠ Conducta online y trampas", color:"#fbbf24", texto:"No está permitido el uso de bots, hacks, mods ni ningún software no autorizado. Truco Online puede suspender o cancelar cuentas por conductas deshonestas, fraudulentas o ilegales sin previo aviso." },
          { titulo:"5. Limitación de responsabilidad", color:"#4ade80", texto:"Truco Online no será responsable por pérdidas o daños derivados del uso o la imposibilidad de usar el servicio. El servicio se proporciona sin ningún tipo de garantía expresa o implícita." },
          { titulo:"6. Vigencia y rescisión", color:"#4ade80", texto:"El acuerdo comienza cuando aceptás los términos. Podés cancelar tu cuenta en cualquier momento. Truco Online puede restringir o cancelar cuentas por incumplimiento de los términos sin obligación de reembolso." },
        ].map((s, i) => (
          <div key={i} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:12,padding:24,marginBottom:16 }}>
            <div style={{ fontSize:13,color:s.color,textTransform:"uppercase",letterSpacing:2,marginBottom:12 }}>{s.titulo}</div>
            <div style={{ fontSize:13,color:"#9ca3af",lineHeight:1.7 }}>{s.texto}</div>
          </div>
        ))}

        <div style={{ textAlign:"center",padding:16,borderTop:"1px solid #2d6a4f",marginTop:8 }}>
          <div style={{ fontSize:11,color:"#4b5563" }}>Truco Online © 2025. Todos los derechos reservados.</div>
        </div>

        <div style={{ textAlign:"center",marginTop:20 }}>
          <button onClick={onVolver} style={{ background:"rgba(0,0,0,0.4)",border:"1px solid #2d6a4f",borderRadius:8,padding:"10px 24px",color:"#4ade80",fontSize:14,cursor:"pointer",fontFamily:"Georgia" }}>
            ← Volver al juego
          </button>
        </div>

      </div>
    </div>
  );
}