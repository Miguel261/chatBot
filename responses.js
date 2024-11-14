const { addKeyword } = require("@bot-whatsapp/bot");
const { delay } = require("@whiskeysockets/baileys");
const { default: axios } = require("axios");

const userData = new Map();

const consultaCurpApi = async (curp) => {
  try {
    const response = await axios.get(
      process.env.apiptm + "/users-siesabi/prueba?curp=" + curp,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${process.env.obtenerToken}`,
        },
      }
    );
    // Devuelve el correo del primer usuario
    const correo = response.data[0]?.email;
    return correo;
  } catch (error) {
    return "No se encontró correo electrónico, verifique su información"; // Manejar el error devolviendo null o algún valor por defecto
  }
};

const funtionApi = async (id, option) => {
  try {
    const user = userData.get(id);

    const jsonData = {
      "curp": user.curp,
      "email": user.email
    }

    if (option === 1) {

      const response = await axios.post(
        process.env.apiptm + "/users-siesabi/datos", JSON.parse(JSON.stringify(jsonData)),
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${process.env.obtenerToken}`,
          },
        }
      );

      return `Tu corrreo es: ${response.data.email} y tu contraseña es: ${response.data.password}`;
    }

    if (option === 2) {

      const response = await axios.post(
        process.env.apiptm + "/users-siesabi/datos", JSON.parse(JSON.stringify(jsonData)), //SE CAMBIA EL ENDPOINT
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${process.env.obtenerToken}`,
          },
        }
      );

      return `Tu corrreo es: ${response.data.email} y tu contraseña es: ${response.data.password}`;
    }

    if (option === 3) {

      /*const response = await axios.post(
        process.env.apiptm + "/users-siesabi/datos", JSON.parse(JSON.stringify(jsonData)), //SE CAMBIA EL ENDPOINT
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${process.env.obtenerToken}`,
          },
        }
      );*/

      return `Nos complace informarle que el error en su cuenta ha sido corregido. Le invitamos a intentar acceder nuevamente a los cursos disponibles. ☑️`;
    }

  }
  catch (error) {
    return "Hubo un error";
  }
};

const flowOption1 = addKeyword("1").addAnswer("Por motivos de calidad y seguridad de la información, le informamos que esta conversación será almacenada. Su información será tratada de acuerdo con nuestras políticas de privacidad y únicamente se utilizará para mejorar nuestros servicios y garantizar la seguridad de los datos.")
  .addAnswer(
    "Para verificar su información necesito de algunos datos, escriba su *CURP* : ",
    { capture: true },
    async (ctx, { flowDynamic, fallBack, gotoFlow }) => {
      const id = ctx.from; //Guardamos el id unico de cada usuario
      const curpUser = ctx.body;
      const curp = curpUser.toUpperCase();
      const correo = await consultaCurpApi(curp);

      if (correo == "No se encontró correo electrónico, verifique su información") {
        await flowDynamic(correo);
        return fallBack();
      }

      userData.set(id, { curp }); // Guarda el CURP en el estado del usuario

      await flowDynamic("📫 El correo es:")
      await delay(1000);
      await flowDynamic(correo);
      userData.get(id).email = correo;
      await delay(1000);
      return gotoFlow(flowConfirmation);
    }
  );

const flowConfirmation = addKeyword("CONFIRMACION").addAnswer("Desea hacer cambio de correo? Conteste con *SI* o *NO*",
  { capture: true },
  async (ctx, { flowDynamic, fallBack, gotoFlow }) => {
    let pregunta = ctx.body.toUpperCase()

    if (pregunta == "SI") {
      return gotoFlow(flowChange);
    } else if (pregunta == "NO") {

      return gotoFlow(flowGeneratePassword);
    } else {
      await flowDynamic("Respuesta no válida");
      return fallBack();
    }
  });


const flowChange = addKeyword("SI").addAnswer("Por favor, proporcione el nuevo correo electrónico a registrar, que sea todo en minúsculas:",
  { capture: true },
  async (ctx, { flowDynamic, fallBack }) => {
    const id = ctx.from;
    const newEmail = ctx.body;
    userData.get(id).email = newEmail;

    const response = await funtionApi(id, 1)
    if (response == "Hubo un error") {
      await flowDynamic("Hubo un error al actualizar tus credenciales, intentelo de nuevo");
      return fallBack();
    }

    await delay(1000);
    await flowDynamic(response);
    await delay(2500);
    await flowDynamic("Para su conveniencia, le recomendamos copiar y pegar las credenciales que se le han proporcionado para evitar errores al ingresarlas. Asimismo, le invitamos cordialmente a guardar esta información en un lugar seguro, ya que será necesaria para acceder a su cuenta en el futuro.");
    await delay(2000);
    await flowDynamic("Hasta pronto 🤓");
  });

const flowGeneratePassword = addKeyword("NO").addAnswer("Se va generar una contraseña temporal",
  null,
  async (ctx, { flowDynamic, fallBack }) => {
    const id = ctx.from;
    const response = await funtionApi(id, 2);

    if (response == "Hubo un error") {
      await flowDynamic("Hubo un error al actualizar tus credenciales, se va reintentar de nuevo");
      return fallBack();
    }

    await delay(1000);
    await flowDynamic(response);
    await delay(2500);
    await flowDynamic("Para su conveniencia, le recomendamos copiar y pegar las credenciales que se le han proporcionado para evitar errores al ingresarlas. Asimismo, le invitamos cordialmente a guardar esta información en un lugar seguro, ya que será necesaria para acceder a su cuenta en el futuro.");
    await delay(2000);
    await flowDynamic("Hasta pronto 🤓");

  });

const flowOption2 = addKeyword("2").addAnswer("Por motivos de calidad y seguridad de la información, le informamos que esta conversación será almacenada. Su información será tratada de acuerdo con nuestras políticas de privacidad y únicamente se utilizará para mejorar nuestros servicios y garantizar la seguridad de los datos.")
  .addAnswer(
    "Para verificar su información necesito de algunos datos, escriba su *CURP* : ",
    { capture: true },
    async (ctx, { flowDynamic }) => {
      const id = ctx.from; //Guardamos el id unico de cada usuario
      const curpUser = ctx.body;
      const curp = curpUser.toUpperCase();
      const correo = await consultaCurpApi(curp);

      if (correo == "No se encontró correo electrónico, verifique su información") {
        await flowDynamic(correo);
        return fallBack();
      }

      userData.set(id, { curp }); // Guarda el CURP en el estado del usuario

      await flowDynamic("📫 El correo es:")
      await delay(1000);
      await flowDynamic(correo);
      await flowDynamic("Se va corregir cuenta SiESABI")

      await delay(2000);
      await flowDynamic("...")

      await delay(2000);
      await flowDynamic("...")
      await delay(1000);
      userData.get(id).email = correo;

      const response = await funtionApi(id, 3);

      if (response == "Hubo un error") {
        await flowDynamic("Contacte algún administrador al correo: siesabi@imssbienestar.gob.mx");
      }

      await delay(1000);
      await flowDynamic(response);
      await delay(2000);
      await flowDynamic("Si encuentra algún inconveniente adicional o tiene alguna pregunta, no dude en contactarnos. Estamos aquí para ayudarle.");
      await delay(1500);
      await flowDynamic("Hasta pronto 🤓");
    }
  );

const flowOption3 = addKeyword("3").addAnswer("La opción que ha seleccionado corresponde a un problema más específico que requiere atención personalizada. Le invitamos a ponerse en contacto con los administradores para brindarle asistencia directa.",
  null,
  async (ctx, { flowDynamic }) => {
    await delay(1500);
    await flowDynamic("Por favor, escriba a siesabi@imssbienestar.gob.mx detallando su situación, y con gusto le ayudaremos a resolverlo a la brevedad posible.");
    await delay(1500);
    await flowDynamic("Agradecemos su comprensión y estamos a su disposición para cualquier consulta adicional.");
    await delay(1500);
    await flowDynamic("Atentamente...");
    await flowDynamic("Tu equipo SiESABI 🤓");
  });

const flowOption4 = addKeyword("4").addAnswer("Para actualizar su información, por favor siga los siguientes pasos:",
  null,
  async (ctx, { flowDynamic }) => {
    await delay(1500);
    await flowDynamic("1. Inicie sesión en su cuenta.");
    await delay(1500);
    await flowDynamic('2. En la página principal, encontrará un botón en la parte derecha que dice "Editar". Desde ahí, podrá actualizar su información personal.');
    await delay(1500);
    await flowDynamic('3. Si desea actualizar su información laboral, justo al lado de la sección de "Información personal" encontrará un apartado correspondiente. Ingrese en él y, de igual manera, verá un botón "Editar" para realizar los cambios necesarios.')
    await delay(1500);
    await flowDynamic("Si tiene alguna duda o necesita asistencia adicional, no dude en contactarnos al correo a siesabi@imssbienestar.gob.mx. Estamos aquí para ayudarle.");
    await delay(1500);
    await flowDynamic("Atentamente...");
    await delay(1500);
    await flowDynamic("Tu equipo SiESABI 🤓");
  });


const flowPrincipal = addKeyword(["GTA5", "GTA6", "GTA7"])
  .addAnswer(
    "Hola, en SiESABI estamos para ayudarte, escribe el número de la opción que más se ajuste a tu consulta 🙌"
  )
  .addAnswer("*Menú de opciones:*")
  .addAnswer(
    [
      "✅ 1. Credenciales no coinciden (Cambio de correo / Generación de contraseña)",
      "✅ 2. Puedo iniciar sesión pero no puedo accesar a los cursos",
      "✅ 3. Problemas con el avance de cursos",
      "✅ 4. Actualización de datos personales y laborales",
      "📄 *Visita nuestro aviso de privacidad:* https://educacion.imssbienestar.gob.mx/privacy-notice",
    ],
    null,
    null,
    [flowOption1, flowConfirmation, flowChange, flowGeneratePassword, flowOption2, flowOption3, flowOption4]
  );

module.exports = flowPrincipal;
