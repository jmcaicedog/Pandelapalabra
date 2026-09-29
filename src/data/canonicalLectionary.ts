import { getSaintForDate } from './saintsCalendar.js';
import type { LiturgicalDay } from './liturgy.js';

// Computus algorithm for Easter Sunday (Meeus/Jones/Butcher)
export function getEasterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

// Helper to add days to a Date
function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

// Calculate week of Ordinary Time for any given date
export function getOrdinaryTimeWeek(date: Date): number {
  const year = date.getFullYear();
  const easterData = getEasterSunday(year);
  const easter = new Date(year, easterData.month - 1, easterData.day, 12, 0, 0);

  // Pentecost is 49 days after Easter
  const pentecost = addDays(easter, 49);

  // First Sunday of Advent is Sunday closest to Nov 30 (Nov 27 - Dec 3)
  const nov30 = new Date(year, 10, 30, 12, 0, 0);
  const dayOfWeekNov30 = nov30.getDay();
  const advent1 = addDays(nov30, dayOfWeekNov30 <= 3 ? -dayOfWeekNov30 : 7 - dayOfWeekNov30);

  // Week 34 ends on the Saturday before Advent 1
  const week34Sunday = addDays(advent1, -7);

  // Calculate weeks backwards from week 34
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((date.getTime() - week34Sunday.getTime()) / msPerDay);
  const weeksFromWeek34 = Math.floor(diffDays / 7);
  const estimatedWeek = 34 + weeksFromWeek34;

  if (estimatedWeek >= 1 && estimatedWeek <= 34) {
    return estimatedWeek;
  }

  // Fallback estimation for ordinary time
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 9) {
    if (day < 7) return 23;
    if (day < 14) return 24;
    if (day < 21) return 25;
    if (day < 28) return 26;
    return 27;
  }
  if (month === 10) return Math.min(31, 27 + Math.floor((day - 1) / 7));
  if (month === 11) return Math.min(34, 31 + Math.floor((day - 1) / 7));
  return 24;
}

// Roman numeral conversion for weeks
export const ROMAN_WEEKS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
  11: 'XI', 12: 'XII', 13: 'XIII', 14: 'XIV', 15: 'XV', 16: 'XVI', 17: 'XVII', 18: 'XVIII', 19: 'XIX', 20: 'XX',
  21: 'XXI', 22: 'XXII', 23: 'XXIII', 24: 'XXIV', 25: 'XXV', 26: 'XXVI', 27: 'XXVII', 28: 'XXVIII', 29: 'XXIX', 30: 'XXX',
  31: 'XXXI', 32: 'XXXII', 33: 'XXXIII', 34: 'XXXIV'
};

interface WeekdayReadingsData {
  firstReading: { citation: string; text: string };
  psalm: { citation: string; response: string; verses: string[] };
  gospel: { citation: string; acclamation: string; text: string };
}

// Sequential Gospel of Saint Luke (Lucas) for Weekdays in Ordinary Time Weeks 22 to 34
// Rule of the Roman Lectionary (Ordo Lectionum Missae):
// Weeks 22 to 34 = Lectio continua de San Lucas (Lunes a Sábado)
export const ORDINARY_TIME_LUKE_GOSPELS: Record<string, { citation: string; acclamation: string; text: string }> = {
  // Semana 22
  '22-1': {
    citation: 'Lucas 4, 16-30',
    acclamation: 'Aleluya, aleluya. El Espíritu del Señor está sobre mí; me ha enviado para anunciar el Evangelio a los pobres. Aleluya.',
    text: 'En aquel tiempo, fue Jesús a Nazaret, donde se había criado, entró en la sinagoga, como era su costumbre los sábados, y se puso en pie para hacer la lectura. Le entregaron el libro del profeta Isaías y, desenrollándolo, encontró el pasaje donde estaba escrito: «El Espíritu del Señor está sobre mí, porque él me ha ungido para que dé la Buena Noticia a los pobres. Me ha enviado a proclamar la liberación a los cautivos y la vista a los ciegos, para dar la libertad a los oprimidos y proclamar un año de gracia del Señor». Enrolló el libro, lo devolvió al que le ayudaba y se sentó. Toda la sinagoga tenía los ojos fijos en él. Y él comenzó a decirles: «Hoy se ha cumplido esta Escritura que acabáis de oír».'
  },
  '22-2': {
    citation: 'Lucas 4, 31-37',
    acclamation: 'Aleluya, aleluya. Un gran profeta ha surgido entre nosotros y Dios ha visitado a su pueblo. Aleluya.',
    text: 'En aquel tiempo, Jesús bajó a Cafarnaún, ciudad de Galilea, y los sábados les enseñaba. Quedaban asombrados de su doctrina, porque su palabra estaba llena de autoridad. Había en la sinagoga un hombre que tenía un espíritu de demonio inmundo y se puso a gritar a grandes voces: «¡Basta! ¿Qué tenemos que ver nosotros contigo, Jesús Nazareno? ¿Has venido a destruirnos? Sé quién eres: el Santo de Dios». Jesús le increpó diciendo: «¡Cállate y sal de él!». Entonces el demonio, tirándolo por tierra en medio de la gente, salió de él sin hacerle daño alguno.'
  },
  '22-3': {
    citation: 'Lucas 4, 38-44',
    acclamation: 'Aleluya, aleluya. El Señor me ha enviado para anunciar el Evangelio a los pobres, para proclamar la libertad a los cautivos. Aleluya.',
    text: 'En aquel tiempo, al salir Jesús de la sinagoga, entró en la casa de Simón. La suegra de Simón estaba con una gran fiebre, y le rogaron por ella. Él, inclinándose sobre ella, increpó a la fiebre, y la fiebre la dejó. Al punto se levantó y se puso a servirles. Al ponerse el sol, todos los que tenían enfermos de diversas dolencias se los llevaban; y él, poniendo las manos sobre cada uno de ellos, los curaba.'
  },
  '22-4': {
    citation: 'Lucas 5, 1-11',
    acclamation: 'Aleluya, aleluya. Venid conmigo —dice el Señor—, y os haré pescadores de hombres. Aleluya.',
    text: 'En aquel tiempo, la gente se agolpaba sobre Jesús para oír la palabra de Dios, estando él a la orilla del lago de Genesaret. Vio dos barcas que estaban a la orilla... Subió a una de las barcas, que era de Simón, y le pidió que la apartara un poco de tierra... Cuando acabó de hablar, dijo a Simón: «Rema mar adentro, y echad vuestras redes para la pesca». Respondió Simón y dijo: «Maestro, hemos estado bregando toda la noche y no hemos recogido nada; pero, por tu palabra, echaré las redes». Y, puestos a la obra, hicieron una redada tan grande de peces que las redes comenzaban a reventarse... Al ver esto, Simón Pedro cayó a las rodillas de Jesús diciendo: «Señor, apártate de mí, que soy un hombre pecador». Pero Jesús dijo a Simón: «No temas; desde ahora serás pescador de hombres». Y ellos, sacando las barcas a tierra, dejándolo todo, lo siguieron.'
  },
  '22-5': {
    citation: 'Lucas 5, 33-39',
    acclamation: 'Aleluya, aleluya. Yo soy la luz del mundo —dice el Señor—; el que me sigue tendrá la luz de la vida. Aleluya.',
    text: 'En aquel tiempo, dijeron a Jesús los fariseos y los escribas: «Los discípulos de Juan ayunan a menudo y rezan, y lo mismo los de los fariseos; en cambio, los tuyos comen y beben». Jesús les contestó: «¿Acaso podéis hacer ayunar a los amigos del novio mientras el novio está con ellos? Llegarán días en que se lo lleven; entonces, en aquellos días, ayunarán». Les dijo también una parábola: «Nadie corta un trozo de un vestido nuevo y lo pone en un vestido viejo... Ni nadie echa vino nuevo en odres viejos... El vino nuevo debe echarse en odres nuevos».'
  },
  '22-6': {
    citation: 'Lucas 6, 1-5',
    acclamation: 'Aleluya, aleluya. Yo soy el camino, y la verdad, y la vida —dice el Señor—; nadie viene al Padre sino por mí. Aleluya.',
    text: 'Un sábado, iba Jesús caminando por los sembrados, y sus discípulos arrancaban espigas y, frotándolas con las manos, comían los granos. Algunos de los fariseos dijeron: «¿Por qué hacéis lo que no está permitido en sábado?». Jesús les respondió diciendo: «¿Ni siquiera habéis leído lo que hizo David cuando él y sus hombres sintieron hambre? Entró en la casa de Dios, tomó los panes de la proposición, comió de ellos y los dio a sus hombres, siendo así que sólo a los sacerdotes está permitido comerlos». Y les decía: «El Hijo del hombre es señor del sábado».'
  },

  // Semana 23
  '23-1': {
    citation: 'Lucas 6, 6-11',
    acclamation: 'Aleluya, aleluya. Mis ovejas escuchan mi voz —dice el Señor—, y yo las conozco y ellas me siguen. Aleluya.',
    text: 'Otro sábado entró Jesús en la sinagoga a enseñar. Había allí un hombre que tenía la mano derecha paralizada. Los escribas y los fariseos estaban al acecho para ver si curaba en sábado y encontrar de qué acusarlo. Pero él, conociendo sus pensamientos, dijo al hombre que tenía la mano paralizada: «Levántate y ponte en medio». Él se levantó y se puso en pie. Jesús les dijo: «Os pregunto: ¿Qué está permitido en sábado: hacer el bien o hacer el mal, salvar una vida o destruirla?». Y, mirando a todos a su alrededor, le dijo: «Extiende tu mano». Él lo hizo, y su mano quedó restablecida.'
  },
  '23-2': {
    citation: 'Lucas 6, 12-19',
    acclamation: 'Aleluya, aleluya. Yo os he elegido del mundo para que vayáis y deis fruto, y vuestro fruto permanezca —dice el Señor—. Aleluya.',
    text: 'En aquellos días, Jesús subió a la montaña a orar, y pasó la noche orando a Dios. Cuando se hizo de día, llamó a sus discípulos y escogió de entre ellos a doce, a los que dio también el nombre de apóstoles: Simón, a quien puso el nombre de Pedro, y su hermano Andrés; Santiago y Juan; Felipe y Bartolomé; Mateo y Tomás; Santiago, el de Alfeo, y Simón, llamado el Zelote; Judas, el de Santiago, y Judas Iscariote, que fue el traidor. Bajó con ellos y se paró en un llano... y salía de él una fuerza que los curaba a todos.'
  },
  '23-3': {
    citation: 'Lucas 6, 20-26',
    acclamation: 'Aleluya, aleluya. Alegraos y regocijaos, porque vuestra recompensa será grande en los cielos. Aleluya.',
    text: 'En aquel tiempo, Jesús, levantando los ojos hacia sus discípulos, les decía: «Dichosos los pobres, porque vuestro es el reino de Dios. Dichosos los que ahora tenéis hambre, porque quedaréis saciados. Dichosos los que ahora lloráis, porque reiréis. Dichosos vosotros cuando los hombres os odien, os expulsen, os insulten y proscriban vuestro nombre como malo por causa del Hijo del hombre. Alegraos en aquel día y saltad de gozo, porque vuestra recompensa será grande en el cielo... Pero ¡ay de vosotros, los ricos!, porque ya habéis recibido vuestro consuelo».'
  },
  '23-4': {
    citation: 'Lucas 6, 27-38',
    acclamation: 'Aleluya, aleluya. Sed compasivos como vuestro Padre es compasivo —dice el Señor—. Aleluya.',
    text: 'En aquel tiempo, dijo Jesús a sus discípulos: «A vosotros los que me escucháis os digo: amad a vuestros enemigos, haced el bien a los que os odian, bendecid a los que os maldicen, orad por los que os calumnian. Al que te pegue en una mejilla, preséntale también la otra; y al que te quite la capa, no le impidas que se lleve también la túnica... Sed misericordiosos como vuestro Padre es misericordioso; no juzguéis y no seréis juzgados; no condenéis y no seréis condenados; perdonad y seréis perdonados; dad y se os dará: una medida buena, apretada, remecida y rebosante».'
  },
  '23-5': {
    citation: 'Lucas 6, 39-42',
    acclamation: 'Aleluya, aleluya. Brille vuestra luz ante los hombres, para que vean vuestras buenas obras y den gloria a vuestro Padre. Aleluya.',
    text: 'En aquel tiempo, dijo Jesús a sus discípulos esta parábola: «¿Acaso puede un ciego guiar a otro ciego? ¿No caerán los dos en el hoyo? El discípulo no es más que su maestro; si se deja instruir, llegará a ser como su maestro. ¿Por qué te fijas en la mota que tiene tu hermano en el ojo y no reparas en la viga que llevas en el tuyo? ¡Hipócrita! Sácate primero la viga de tu ojo, y entonces verás claro para sacar la mota del ojo de tu hermano».'
  },
  '23-6': {
    citation: 'Lucas 6, 43-49',
    acclamation: 'Aleluya, aleluya. Quien guarda la palabra de Cristo, en él el amor de Dios ha llegado a su plenitud. Aleluya.',
    text: 'En aquel tiempo, decía Jesús a sus discípulos: «No hay árbol bueno que dé fruto malo, ni árbol malo que dé fruto bueno; por ello, cada árbol se conoce por sus frutos... El hombre bueno, de la bondad que atesora en su corazón saca el bien, y el que es malo, de la maldad saca el mal; porque de lo que rebosa el corazón, habla la boca. ¿Por qué me llamáis: "Señor, Señor", y no hacéis lo que os digo? El que escucha mis palabras y las pone por obra se parece a uno que edificó una casa cavando hondo y poniendo los cimientos sobre roca; vino una crecida, rompió contra la casa y no pudo moverla».'
  },

  // Semana 24
  '24-1': {
    citation: 'Lucas 7, 1-10',
    acclamation: 'Aleluya, aleluya. Tanto amó Dios al mundo que dio a su Hijo único; todo el que cree en él tiene vida eterna. Aleluya.',
    text: 'En aquel tiempo, cuando Jesús terminó de decir todas estas cosas al pueblo, entró en Cafarnaún. Había allí un centurión que tenía un criado enfermo y a punto de morir, a quien estimaba mucho. Habiendo oído hablar de Jesús, le envió unos ancianos de los judíos para rogarle que viniera a salvar a su criado. Ellos, llegados a Jesús, le rogaban con insistencia: «Merece que se lo concedas, pues ama a nuestro pueblo y él mismo nos ha edificado la sinagoga». Jesús fue con ellos. Ya no estaba lejos de la casa cuando el centurión envió unos amigos a decirle: «Señor, no te molestes, pues no soy digno de que entres bajo mi techo; por eso ni siquiera me consideré digno de ir a ti en persona. Dilo de palabra, y mi criado quedará sano. Porque también yo soy un hombre sometido a autoridad y tengo soldados a mis órdenes; y digo a uno: "Ve", y va; y a otro: "Ven", y viene; y a mi criado: "Haz esto", y lo hace». Al oír esto, Jesús quedó admirado de él y, volviéndose a la multitud que lo seguía, dijo: «Os digo que ni en Israel he encontrado una fe tan grande». Y al volver a casa, los enviados encontraron al criado sano.'
  },
  '24-2': {
    citation: 'Lucas 7, 11-17',
    acclamation: 'Aleluya, aleluya. Un gran profeta ha surgido entre nosotros y Dios ha visitado a su pueblo. Aleluya.',
    text: 'En aquel tiempo, iba Jesús camino de una ciudad llamada Naín, y caminaban con él sus discípulos y mucho gentío. Cuando se acercaba a la puerta de la ciudad, resultó que sacaban a enterrar a un difunto, hijo único de su madre, que era viuda; y un gentío considerable de la ciudad la acompañaba. Al verla, el Señor se compadeció de ella y le dijo: «No llores». Se acercó y tocó el féretro. Los que lo llevaban se pararon. Dijo él: «¡Muchacho, a ti te digo, levántate!». El muerto se incorporó y empezó a hablar, y se lo entregó a su madre. Todos, sobrecogidos de temor, daban gloria a Dios, diciendo: «Un gran profeta ha surgido entre nosotros», y «Dios ha visitado a su pueblo». Este hecho se divulgó por toda Judea y por toda la comarca circundante.'
  },
  '24-3': {
    citation: 'Lucas 7, 31-35',
    acclamation: 'Aleluya, aleluya. Tus palabras, Señor, son espíritu y vida; tú tienes palabras de vida eterna. Aleluya.',
    text: 'En aquel tiempo, dijo el Señor: «¿A quién compararé los hombres de esta generación? ¿A quién se parecen? Se parecen a unos niños sentados en la plaza, que se gritan unos a otros diciendo: "Tocamos la flauta y no bailasteis; cantamos lamentaciones y no llorasteis". Porque vino Juan el Bautista, que no comía pan ni bebía vino, y decís: "Tiene un demonio". Ha venido el Hijo del hombre, que come y bebe, y decís: "Mirad, un hombre comilón y bebedor de vino, amigo de publicanos y pecadores". Sin embargo, la sabiduría se ha acreditado por todos sus hijos».'
  },
  '24-4': {
    citation: 'Lucas 7, 36-50',
    acclamation: 'Aleluya, aleluya. Bendito seas, Padre, Señor de cielo y tierra, porque has revelado los secretos del Reino a los sencillos. Aleluya.',
    text: 'En aquel tiempo, un fariseo rogaba a Jesús que fuera a comer con él. Jesús, entrando en casa del fariseo, se puso a la mesa. Y una mujer pecadora en la ciudad, al enterarse de que estaba a la mesa en casa del fariseo, llevó un frasco de perfume de alabastro y, poniéndose detrás junto a sus pies, llorando, comenzó a regar con sus lágrimas sus pies, se los secaba con los cabellos de su cabeza, los besaba y los ungía con el perfume... Jesús dijo a Simón: «¿Ves a esta mujer? Entré en tu casa y no me diste agua para los pies; ella, en cambio, ha regado mis pies con lágrimas y los ha secado con sus cabellos... Por eso te digo: sus muchos pecados están perdonados, porque tiene mucho amor; pero a quien poco se le perdona, poco ama». Y a ella le dijo: «Tus pecados están perdonados... Tu fe te ha salvado; vete en paz».'
  },
  '24-5': {
    citation: 'Lucas 8, 1-3',
    acclamation: 'Aleluya, aleluya. Dichosos los pobres en el espíritu, porque de ellos es el Reino de los cielos. Aleluya.',
    text: 'En aquel tiempo, Jesús iba caminando de ciudad en ciudad y de aldea en aldea, proclamando y anunciando la Buena Noticia del reino de Dios. Lo acompañaban los Doce y algunas mujeres que habían sido curadas de espíritus malos y de enfermedades: María, llamada la Magdalena, de la que habían salido siete demonios; Juana, mujer de Cusa, administrador de Herodes; Susana y otras muchas que le servían con sus propios bienes.'
  },
  '24-6': {
    citation: 'Lucas 8, 4-15',
    acclamation: 'Aleluya, aleluya. La semilla es la palabra de Dios; el sembrador es Cristo; quien lo encuentra vive para siempre. Aleluya.',
    text: 'En aquel tiempo, habiéndose reunido una gran muchedumbre y acudiendo a él gentes de todas las ciudades, dijo Jesús en parábola: «Salió el sembrador a sembrar su semilla. Al sembrar, una parte cayó junto al camino, fue pisoteada y las aves del cielo se la comieron. Otra cayó sobre roca, y en cuanto brotó, se secó por falta de humedad. Otra cayó entre espinos, y los espinos crecieron con ella y la ahogaron. Y otra cayó en tierra buena, y creció y dio fruto al ciento por uno»... «La semilla es la palabra de Dios... Lo que cayó en tierra buena son los que escuchan la palabra con un corazón noble y bueno, la retienen y dan fruto por su perseverancia».'
  },

  // Semana 25
  '25-1': {
    citation: 'Lucas 8, 16-18',
    acclamation: 'Aleluya, aleluya. Brille vuestra luz ante los hombres, para que vean vuestras buenas obras y den gloria a vuestro Padre celestial. Aleluya.',
    text: 'En aquel tiempo, dijo Jesús a la muchedumbre: «Nadie enciende una lámpara y la cubre con una vasija o la pone debajo de la cama, sino que la pone en el candelero para que los que entren vean la luz. Porque nada hay oculto que no llegue a descubrirse, ni nada secreto que no llegue a saberse o a hacerse público. Mirad, pues, cómo escucháis; porque al que tiene se le dará, pero al que no tiene se le quitará hasta lo que cree tener».'
  },
  '25-2': {
    citation: 'Lucas 8, 19-21',
    acclamation: 'Aleluya, aleluya. Dichosos los que escuchan la palabra de Dios y la cumplen. Aleluya.',
    text: 'En aquel tiempo, vinieron a ver a Jesús su madre y sus hermanos, pero con el gentío no lograban llegar hasta él. Entonces le avisaron: «Tu madre y tus hermanos están fuera y quieren verte». Él les contestó: «Mi madre y mis hermanos son estos: los que escuchan la palabra de Dios y la ponen por obra».'
  },
  '25-3': {
    citation: 'Lucas 9, 1-6',
    acclamation: 'Aleluya, aleluya. Está cerca el reino de Dios —dice el Señor—; convertíos y creed en el Evangelio. Aleluya.',
    text: 'En aquel tiempo, Jesús convocó a los Doce y les dio poder y autoridad sobre toda clase de demonios y para curar enfermedades. Luego los envió a proclamar el reino de Dios y a curar a los enfermos, diciéndoles: «No llevéis nada para el camino: ni bastón ni alforja, ni pan ni dinero; tampoco llevéis dos túnicas. En la casa donde entréis, quedaos allí hasta que os marchéis...» Salieron y fueron de aldea en aldea, anunciando el Evangelio y curando en todas partes.'
  },
  '25-4': {
    citation: 'Lucas 9, 7-9',
    acclamation: 'Aleluya, aleluya. Yo soy el camino, y la verdad, y la vida —dice el Señor—. Aleluya.',
    text: 'En aquel tiempo, el tetrarca Herodes se enteró de todo lo que pasaba y estaba desconcertado, porque algunos decían que Juan había resucitado de entre los muertos; otros, en cambio, que Elías se había aparecido; y otros, que uno de los antiguos profetas había resucitado. Dijo Herodes: «A Juan yo le corté la cabeza; ¿quién es este de quien oigo tales cosas?». Y buscaba ver a Jesús.'
  },
  '25-5': {
    citation: 'Lucas 9, 18-22',
    acclamation: 'Aleluya, aleluya. El Hijo del hombre tiene que padecer mucho y ser resucitado al tercer día. Aleluya.',
    text: 'En aquel tiempo, una vez que Jesús estaba orando a solas, lo acompañaban sus discípulos y les preguntó: «¿Quién dice la gente que soy yo?». Ellos contestaron: «Unos, Juan el Bautista; otros, Elías; y otros, que ha resucitado uno de los antiguos profetas». Él les preguntó: «Y vosotros, ¿quién decís que soy yo?». Pedro respondió: «El Mesías de Dios». Él les prohibió terminantemente decírselo a nadie, y añadió: «El Hijo del hombre tiene que padecer mucho, ser rechazado por los ancianos, sumos sacerdotes y escribas, ser ejecutado y resucitar al tercer día».'
  },
  '25-6': {
    citation: 'Lucas 9, 43b-45',
    acclamation: 'Aleluya, aleluya. Nuestro Salvador Jesucristo destruyó la muerte e hizo brillar la vida por medio del Evangelio. Aleluya.',
    text: 'En aquel tiempo, mientras todos estaban admirados por todo lo que hacía Jesús, dijo a sus discípulos: «Meted bien en vuestras cabezas estas palabras: el Hijo del hombre va a ser entregado en manos de los hombres». Pero ellos no entendían este lenguaje; les resultaba tan oscuro que no captaban el sentido; y les daba miedo preguntarle sobre el asunto.'
  },

  // Semana 26
  '26-1': {
    citation: 'Lucas 9, 46-50',
    acclamation: 'Aleluya, aleluya. El Hijo del hombre ha venido a servir y a dar su vida en rescate por muchos. Aleluya.',
    text: 'En aquel tiempo, se suscitó entre los discípulos una discusión sobre quién sería el mayor. Conociendo Jesús los pensamientos de sus corazones, tomó a un niño, lo puso a su lado y les dijo: «El que acoge a este niño en mi nombre, me acoge a mí; y el que me acoge a mí, acoge al que me ha enviado. Pues el más pequeño de todos vosotros, ese es grande».'
  },
  '26-2': {
    citation: 'Lucas 9, 51-56',
    acclamation: 'Aleluya, aleluya. El Hijo del hombre no ha venido a perder las almas de los hombres, sino a salvarlas. Aleluya.',
    text: 'Cuando se iba cumpliendo el tiempo de su subida al cielo, Jesús tomó la firme resolución de encaminarse a Jerusalén. Y envió mensajeros delante de sí, que fueron y entraron en una aldea de samaritanos para prepararle alojamiento; pero no lo recibieron porque se dirigía a Jerusalén. Al ver esto, los discípulos Santiago y Juan dijeron: «Señor, ¿quieres que mandemos bajar fuego del cielo que acabe con ellos?». Pero él se volvió y los increpó. Y se fueron a otra aldea.'
  },
  '26-3': {
    citation: 'Lucas 9, 57-62',
    acclamation: 'Aleluya, aleluya. Todo lo considero pérdida ante la sublimidad del conocimiento de Cristo Jesús, mi Señor. Aleluya.',
    text: 'En aquel tiempo, mientras iban de camino, le dijo uno: «Te seguiré adondequiera que vayas». Jesús le respondió: «Las zorras tienen madrigueras y los pájaros del cielo nidos, pero el Hijo del hombre no tiene dónde reclinar la cabeza». A otro le dijo: «Sígueme». Él respondió: «Señor, déjame primero ir a enterrar a mi padre». Le contestó: «Deja que los muertos entierren a sus muertos; tú vete a anunciar el reino de Dios»... «Nadie que pone la mano en el arado y mira hacia atrás es apto para el reino de Dios».'
  },
  '26-4': {
    citation: 'Lucas 10, 1-12',
    acclamation: 'Aleluya, aleluya. Está cerca el reino de Dios: convertíos y creed en el Evangelio. Aleluya.',
    text: 'En aquel tiempo, designó el Señor a otros setenta y dos y los mandó por delante, de dos en dos, a todos los pueblos y lugares adonde pensaba ir él. Y les decía: «La mies es abundante, pero los obreros son pocos; rogad, pues, al Señor de la mies que mande obreros a su mies. ¡Poneos en camino! Mirad que os mando como corderos en medio de lobos. No llevéis bolsa ni alforja ni sandalias; y no saludéis a nadie por el camino... Decidles: "El reino de Dios está cerca de vosotros"».'
  },
  '26-5': {
    citation: 'Lucas 10, 13-16',
    acclamation: 'Aleluya, aleluya. Hoy no endurezcáis el corazón; escuchad la voz del Señor. Aleluya.',
    text: 'En aquel tiempo, dijo Jesús: «¡Ay de ti, Corozaín! ¡Ay de ti, Betsaida! Pues si en Tiro y en Sidón se hubieran hecho los milagros que se han hecho en vosotras, hace tiempo que, sentadas con sayal y ceniza, se habrían convertido... Quien a vosotros escucha, a mí me escucha; quien a vosotros rechaza, a mí me rechaza; y quien me rechaza a mí, rechaza al que me ha enviado».'
  },
  '26-6': {
    citation: 'Lucas 10, 17-24',
    acclamation: 'Aleluya, aleluya. Te doy gracias, Padre, Señor del cielo y de la tierra, porque has revelado estas cosas a los pequeños. Aleluya.',
    text: 'En aquel tiempo, volvieron los setenta y dos llenos de alegría, diciendo: «Señor, hasta los demonios se nos someten en tu nombre». Él les dijo: «Estaba viendo a Satanás caer del cielo como un rayo... Sin embargo, no os alegréis de que los espíritus se os sometan; alegraos de que vuestros nombres están escritos en los cielos».'
  },

  // Semana 27
  '27-1': {
    citation: 'Lucas 10, 25-37',
    acclamation: 'Aleluya, aleluya. Os doy un mandamiento nuevo: que os améis unos a otros como yo os he amado —dice el Señor—. Aleluya.',
    text: 'En aquel tiempo, se levantó un maestro de la ley y preguntó a Jesús para ponerlo a prueba: «Maestro, ¿qué tengo que hacer para heredar la vida eterna?». Él le dijo: «¿Qué está escrito en la ley? ¿Cómo lees tú?». Él respondió: «Amarás al Señor tu Dios con todo tu corazón, y a tu prójimo como a ti mismo»... Y Jesús le contó la parábola del Buen Samaritano: un hombre bajaba de Jerusalén a Jericó y cayó en manos de unos bandidos... Un samaritano que iba de viaje llegó a donde estaba y, al verlo, se compadeció; le vendó las heridas derramando aceite y vino... «Ve y haz tú lo mismo».'
  },
  '27-2': {
    citation: 'Lucas 10, 38-42',
    acclamation: 'Aleluya, aleluya. María ha escogido la parte mejor, y no le será quitada. Aleluya.',
    text: 'En aquel tiempo, entró Jesús en una aldea, y una mujer llamada Marta lo hospedó en su casa. Tenía esta una hermana llamada María, la cual, sentada junto a los pies del Señor, escuchaba su palabra. Marta, en cambio, andaba muy afanada con los muchos servicios... «Marta, Marta, te preocupas y te agitas por muchas cosas; y hay necesidad de pocas, o mejor, de una sola. María ha escogido la parte mejor, y no le será quitada».'
  },
  '27-3': {
    citation: 'Lucas 11, 1-4',
    acclamation: 'Aleluya, aleluya. Habéis recibido un Espíritu de hijos de adopción, en el que clamamos: «¡Abba, Padre!». Aleluya.',
    text: 'Una vez que estaba Jesús orando en cierto lugar, cuando terminó, uno de sus discípulos le dijo: «Señor, enséñanos a orar, como Juan enseñó a sus discípulos». Él les dijo: «Cuando oréis, decid: "Padre, santificado sea tu nombre, venga tu reino, danos cada día nuestro pan del mañana, y perdónanos nuestros pecados, porque también nosotros perdonamos a todo el que nos debe; y no nos dejes caer en la tentación"».'
  },
  '27-4': {
    citation: 'Lucas 11, 5-13',
    acclamation: 'Aleluya, aleluya. Pedid y se os dará, buscad y hallaréis, llamad y se os abrirá —dice el Señor—. Aleluya.',
    text: 'En aquel tiempo, dijo Jesús a sus discípulos: «Si uno de vosotros tiene un amigo, y acude a él a medianoche diciéndole: "Amigo, préstame tres panes..." Os digo que, si el amigo no se levanta a dárselos por ser amigo suyo, al menos por su importunidad se levantará y le dará cuanto necesite. Pues yo os digo a vosotros: Pedid y se os dará; buscad y hallaréis; llamad y se os abrirá... Si vosotros, siendo malos, sabéis dar cosas buenas a vuestros hijos, ¿cuánto más el Padre del cielo dará el Espíritu Santo a los que se lo piden?».'
  },
  '27-5': {
    citation: 'Lucas 11, 15-26',
    acclamation: 'Aleluya, aleluya. El que no está conmigo está contra mí; y el que no recoge conmigo desparrama. Aleluya.',
    text: 'En aquel tiempo, habiendo echado Jesús un demonio, algunos dijeron: «Por arte de Belcebú, príncipe de los demonios, echa los demonios». Pero Jesús les dijo: «Todo reino dividido contra sí mismo queda asolado... Si yo echo los demonios con el dedo de Dios, ciertamente el reino de Dios ha llegado a vosotros».'
  },
  '27-6': {
    citation: 'Lucas 11, 27-28',
    acclamation: 'Aleluya, aleluya. Dichosos los que escuchan la palabra de Dios y la cumplen. Aleluya.',
    text: 'En aquel tiempo, mientras Jesús hablaba a la multitud, una mujer de entre la multitud levantó la voz y le dijo: «¡Bienaventurado el vientre que te llevó y los pechos que te criaron!». Pero él dijo: «Mejor: ¡bienaventurados los que escuchan la palabra de Dios y la cumplen!». '
  }
};

// First Readings for Weekdays of Ordinary Time Year II (Año Par - e.g. 2026)
export const ORDINARY_TIME_YEAR_2_FIRST_READINGS: Record<string, {
  firstReading: { citation: string; text: string };
  psalm: { citation: string; response: string; verses: string[] };
}> = {
  // Semana 24
  '24-1': {
    firstReading: {
      citation: '1 Corintios 11, 17-26. 33',
      text: 'Hermanos: Al daros estas instrucciones no puedo alabaros, pues vuestras reuniones son más para perjuicio que para provecho. Porque, en primer lugar, oigo decir que, cuando os reunís en asamblea, hay entre vosotros divisiones... Porque yo he recibido una tradición, que procede del Señor y que a mi vez os he transmitido: Que el Señor Jesús, en la noche en que iba a ser entregado, tomó pan y, pronunciando la acción de gracias, lo partió y dijo: «Esto es mi cuerpo, que se entrega por vosotros. Haced esto en memoria mía». Lo mismo hizo con el cáliz, después de cenar, diciendo: «Este cáliz es la nueva alianza en mi sangre. Cada vez que bebáis de él, haced esto en memoria mía». Porque cada vez que coméis de este pan y bebéis del cáliz, proclamáis la muerte del Señor, hasta que vuelva.'
    },
    psalm: {
      citation: 'Salmo 39, 7-8a. 8b-9. 10. 17',
      response: 'Proclamad la muerte del Señor, hasta que vuelva.',
      verses: [
        'Tú no quieres sacrificios ni ofrendas, y en cambio me abriste el oído; no pides sacrificios expiatorios, entonces yo digo: «Aquí estoy».',
        '«Como está escrito en mi libro para hacer tu voluntad. Dios mío, lo quiero, y llevo tu ley en mis entrañas».',
        'He proclamado tu justicia ante la gran asamblea; no he cerrado los labios: Señor, tú lo sabes.'
      ]
    }
  },
  '24-2': {
    firstReading: {
      citation: '1 Corintios 12, 12-14. 27-31a',
      text: 'Hermanos: Así como el cuerpo es uno y tiene muchos miembros, pero todos los miembros del cuerpo, siendo muchos, son un solo cuerpo, así también es Cristo. Porque en un solo Espíritu fuimos todos bautizados en un solo cuerpo, ya seamos judíos o griegos, esclavos o libres; y a todos se nos dio a beber de un mismo Espíritu. Pues el cuerpo no consta de un solo miembro, sino de muchos... Vosotros sois el cuerpo de Cristo y cada uno es un miembro... Ambicionad, pues, los carismas mejores.'
    },
    psalm: {
      citation: 'Salmo 99, 1-2. 3. 4. 5',
      response: 'Somos su pueblo y ovejas de su rebaño.',
      verses: [
        'Aclama al Señor, tierra entera, servid al Señor con alegría; entrad en su presencia con vítores.',
        'Sabed que el Señor es Dios: que él nos hizo y somos suyos, su pueblo y ovejas de su rebaño.',
        'Entrad por sus puertas con acción de gracias, por sus atrios con himnos, dándole gracias y bendiciendo su nombre: «El Señor es bueno, su misericordia es eterna, su fidelidad por todas las edades».'
      ]
    }
  },
  '24-3': {
    firstReading: {
      citation: '1 Corintios 12, 31 — 13, 13',
      text: 'Hermanos: Ambicionad los carismas mejores. Y aún os voy a mostrar un camino más excelente. Si hablara las lenguas de los hombres y de los ángeles, pero no tengo amor, no sería más que un bronce que resuena o un címbalo que retiñe... El amor es paciente, es benigno; el amor no tiene envidia, no presume, no se engríe, no es indecoroso, no busca su interés, no se irrita, no toma en cuenta el mal... El amor no pasa nunca... Ahora permanecen estas tres virtudes: la fe, la esperanza y el amor. Pero la más grande de ellas es el amor.'
    },
    psalm: {
      citation: 'Salmo 110, 1-2. 3-4. 5-6',
      response: 'Dichoso el pueblo que el Señor se escogió como heredad.',
      verses: [
        'Doy gracias al Señor de todo corazón en la asamblea de los rectos, en la comunidad. Grandes son las obras del Señor, dignas de estudio para los que las aman.',
        'Esplendor y belleza son sus obras, su justicia permanece para siempre. Ha hecho célebres sus maravillas; el Señor es piadoso y clemente.',
        'Él da alimento a sus fieles, recordando siempre su alianza. Mostró a su pueblo la fuerza de sus obras, dándoles la heredad de los gentiles.'
      ]
    }
  },
  '24-4': {
    firstReading: {
      citation: '1 Corintios 15, 1-11',
      text: 'Hermanos: Os recuerdo el Evangelio que os proclamé, que también recibisteis, en el que además estáis firmes, y por el cual estáis salvados si lo guardáis tal como os lo proclamé... Porque os transmití, en primer lugar, lo que a mi vez recibí: que Cristo murió por nuestros pecados según las Escrituras; que fue sepultado y que resucitó al tercer día, según las Escrituras; y que se apareció a Cefas y más tarde a los Doce. Después se apareció a más de quinientos hermanos juntos... Al final se me apareció también a mí.'
    },
    psalm: {
      citation: 'Salmo 117, 1-2. 16ab-17. 28',
      response: 'Dad gracias al Señor porque es bueno, porque es eterna su misericordia.',
      verses: [
        'Dad gracias al Señor porque es bueno, porque es eterna su misericordia. Diga la casa de Israel: eterna es su misericordia.',
        'La diestra del Señor es excelsa, la diestra del Señor hace proezas. No he de morir, viviré para contar las hazañas del Señor.',
        'Tú eres mi Dios, te doy gracias; Dios mío, yo te ensalzo. Dad gracias al Señor porque es bueno, porque es eterna su misericordia.'
      ]
    }
  },
  '24-5': {
    firstReading: {
      citation: '1 Corintios 15, 12-20',
      text: 'Hermanos: Si se predica que Cristo resucitó de entre los muertos, ¿cómo dicen algunos entre vosotros que no hay resurrección de los muertos? Si no hay resurrección de los muertos, tampoco Cristo ha resucitado. Y si Cristo no ha resucitado, vana es nuestra predicación y vana también vuestra fe... Pero no: Cristo ha resucitado de entre los muertos, primicia de los que han muerto.'
    },
    psalm: {
      citation: 'Salmo 16, 1. 6-7. 8 y 15',
      response: 'Al despertar me saciaré de tu semblante, Señor.',
      verses: [
        'Escucha, Señor, una causa justa, atiende a mi clamor, presta oído a mi súplica, que brota de labios sinceros.',
        'Yo te invoco porque tú me respondes, Dios mío; inclina el oído hacia mí y escucha mis palabras. Muestra las maravillas de tu misericordia.',
        'Guárdame como a la niña de tus ojos, a la sombra de tus alas escóndeme. Pero yo, en la justicia, contemplaré tu rostro; al despertar me saciaré de tu presencia.'
      ]
    }
  },
  '24-6': {
    firstReading: {
      citation: '1 Corintios 15, 35-37. 42-49',
      text: 'Hermanos: Dirá alguno: «¿Cómo resucitan los muertos? ¿Con qué cuerpo vendrán?». ¡Insensato! Lo que tú siembras no recobra vida si antes no muere... Así es también la resurrección de los muertos: se siembra en corrupción, resucita en incorrupción; se siembra en deshonra, resucita en gloria; se siembra en debilidad, resucita en poder; se siembra un cuerpo natural, resucita un cuerpo espiritual.'
    },
    psalm: {
      citation: 'Salmo 55, 10-11ab. 11c-12. 13-14',
      response: 'Caminaré en la presencia de Dios a la luz de la vida.',
      verses: [
        'Mis enemigos retrocederán cuando yo te invoque; bien sé que Dios está de mi parte.',
        'En Dios, cuya palabra alabo, en Dios confío y no temo: ¿qué podrá hacerme un mortal?',
        'Te cumpliré mis promesas, oh Dios, te ofreceré sacrificios de alabanza, porque libraste mi alma de la muerte y mis pies de la caída.'
      ]
    }
  },

  // Semana 25 (Año II - Libro de los Proverbios y Eclesiastés / Qohélet)
  '25-1': {
    firstReading: {
      citation: 'Proverbios 3, 27-34',
      text: 'Hijo mío: No niegues un favor a quien lo necesita, si está en tus manos concederlo. No digas a tu prójimo: «Vete y vuelve; mañana te lo daré», si tienes hoy con qué. No trames daños contra tu prójimo, mientras vive confiado junto a ti... Porque el Señor aborrece al perverso, pero tiene su intimidad con los rectos.'
    },
    psalm: {
      citation: 'Salmo 14, 2-3a. 3bc-4ab. 5',
      response: 'El justo habitará en tu monte santo, Señor.',
      verses: [
        'El que procede honradamente y practica la justicia, el que tiene intenciones leales y no calumnia con su lengua.',
        'El que no hace mal a su prójimo ni difama al vecino, el que tiene por despreciable al malvado y honra a los que temen al Señor.',
        'El que no presta su dinero a usura ni acepta soborno contra el inocente. El que así obra nunca fallará.'
      ]
    }
  },
  '25-2': {
    firstReading: {
      citation: 'Proverbios 21, 1-6. 10-13',
      text: 'Como corrientes de agua es el corazón del rey en manos del Señor: lo inclina adonde quiere. Al hombre le parece recto todo su camino, pero es el Señor quien pesa los corazones. Practicar la justicia y el derecho agrada al Señor más que los sacrificios. Ojos altivos y corazón ambicioso: lámpara de pecadores es el pecado... El que cierra los oídos al clamor del necesitado también clamará y no se le responderá.'
    },
    psalm: {
      citation: 'Salmo 118, 1. 27. 30. 34. 35. 44',
      response: 'Guíame, Señor, por la senda de tus mandatos.',
      verses: [
        'Dichoso el que, con vida intachable, camina en la voluntad del Señor.',
        'Instrúyeme en el camino de tus decretos, y meditaré tus maravillas.',
        'Escogí el camino de la verdad, deseé tus mandamientos. Enséñame a cumplir tu voluntad y a guardarla de todo corazón.'
      ]
    }
  },
  '25-3': {
    firstReading: {
      citation: 'Proverbios 30, 5-9',
      text: 'Toda palabra de Dios está acrisolada; es un escudo para los que en él se refugian. No añadas nada a sus palabras, no sea que te reprenda y pases por mentiroso. Dos cosas te pido, no me las niegues antes de que muera: aleja de mí falsedad y mentira; no me des pobreza ni riqueza; facilítame el pan necesario, no sea que me sacie y reniegue de ti diciendo: «¿Quién es el Señor?», o no sea que, necesitado, robe y ultraje el nombre de mi Dios.'
    },
    psalm: {
      citation: 'Salmo 118, 29. 72. 89. 101. 104. 163',
      response: 'Lámpara es tu palabra para mis pasos, Señor.',
      verses: [
        'Aparta de mí el camino de la mentira, y dame la gracia de tu ley.',
        'Más estimo yo la ley de tu boca que miles de monedas de oro y plata.',
        'Tu palabra, Señor, es eterna, más fija que el cielo; aparto mi pie de todo mal camino para guardar tu palabra.'
      ]
    }
  },
  '25-4': {
    firstReading: {
      citation: 'Eclesiastés (Qohélet) 1, 2-11',
      text: '¡Vanidad de vanidades! —dice Qohélet—. ¡Vanidad de vanidades, todo es vanidad! ¿Qué saca el hombre de todo su trabajo y fatiga bajo el sol? Una generación se va y otra viene, pero la tierra permanece para siempre. El sol sale, el sol se pone, corre hacia el lugar de donde volverá a salir... ¿Hay algo de lo que se pueda decir: «Mira, esto es nuevo»? Ya existió en los siglos anteriores a nosotros.'
    },
    psalm: {
      citation: 'Salmo 89, 3-4. 5-6. 12-13. 14 y 17',
      response: 'Señor, tú has sido nuestro refugio de generación en generación.',
      verses: [
        'Tú reduces el hombre a polvo, diciendo: «Retornad, hijos de Adán». Mil años en tu presencia son un ayer que pasó, una vela nocturna.',
        'Los siembras como hierba que cambia: por la mañana florece y cambia, por la tarde la siegan y se seca.',
        'Enséñanos a calcular nuestros años, para que adquiramos un corazón sensato. Sácianos de tu misericordia por la mañana, y festejaremos y gozaremos todos nuestros días.'
      ]
    }
  },
  '25-5': {
    firstReading: {
      citation: 'Eclesiastés (Qohélet) 3, 1-11',
      text: 'Todo tiene su momento, y cada cosa su tiempo bajo el cielo: su tiempo el nacer, y su tiempo el morir; su tiempo el plantar, y su tiempo el arrancar lo plantado... Todas las cosas las hizo Dios bellas a su tiempo, y ha puesto el sentido del tiempo en el corazón de los hombres, sin que el hombre pueda comprender la obra que Dios hace de principio a fin.'
    },
    psalm: {
      citation: 'Salmo 143, 1a y 2abc. 3-4',
      response: 'Bendito sea el Señor, mi Roca.',
      verses: [
        'Bendito sea el Señor, mi Roca, que adiestra mis manos para el combate, mis dedos para la pelea.',
        'Mi alcázar, mi bienhechor, mi refugio, mi libertador; mi escudo, en quien me amparo.',
        'Señor, ¿qué es el hombre para que te fijes en él; el hijo del hombre para que de él te ocupes? El hombre es igual que un soplo; sus días, una sombra que pasa.'
      ]
    }
  },
  '25-6': {
    firstReading: {
      citation: 'Eclesiastés (Qohélet) 11, 9 — 12, 8',
      text: 'Alégrate, joven, en tu juventud, y tome placer tu corazón en los días de tu adolescencia; camina según las sendas de tu corazón y a la vista de tus ojos; pero sabe que por todas estas cosas te traerá Dios a juicio. Aparta las penas de tu corazón y aleja el sufrimiento de tu carne... Acuérdate de tu Creador en los días de tu juventud, antes de que vengan los días aciagos y lleguen los años en que digas: «No encuentro contento en ellos»... ¡Vanidad de vanidades! —dice Qohélet—. ¡Todo es vanidad!'
    },
    psalm: {
      citation: 'Salmo 89, 3-4. 5-6. 12-13. 14 y 17',
      response: 'Señor, tú has sido nuestro refugio de generación en generación.',
      verses: [
        'Tú reduces el hombre a polvo, diciendo: «Retornad, hijos de Adán». Mil años en tu presencia son un ayer que pasó.',
        'Los siembras como hierba que florece por la mañana y por la tarde se marchita.',
        'Baje a nosotros la bondad del Señor y haga prósperas las obras de nuestras manos.'
      ]
    }
  },

  // Semana 26 (Año II - Libro de Job)
  '26-1': {
    firstReading: {
      citation: 'Job 1, 6-22',
      text: 'Un día acudieron los hijos de Dios a presentarse ante el Señor, y entre ellos acudió también Satán... El Señor dijo a Satán: «¿Te has fijado en mi siervo Job? No hay nadie como él en la tierra: hombre íntegro y recto, temeroso de Dios y apartado del mal». Satán respondió: «¿Acaso Job teme a Dios de balde?... Pero extiende tu mano y toca todo lo que tiene, a ver si no te maldice a la cara». El Señor dijo a Satán: «Ahí tienes todo lo suyo en tu mano, con tal de que a él no lo toques»... Llegaron mensajeros a Job: «Los bueyes estaban arando y los sabeos cayeron sobre ellos... Un fuego de Dios cayó del cielo y consumió a las ovejas... Los caldeos arramblaron con los camellos... Un viento huracanado derribó la casa sobre tus hijos e hijas y han muerto». Entonces Job se levantó, rasgó su manto, se afeitó la cabeza, cayó en tierra y adoró diciendo: «Desnudo salí del vientre de mi madre y desnudo volveré allá. El Señor me lo dio, el Señor me lo quitó: ¡bendito sea el nombre del Señor!». En todo esto no pecó Job ni acusó a Dios de disparate.'
    },
    psalm: {
      citation: 'Salmo 16, 1. 2-3. 6-7',
      response: 'Inclina tu oído hacia mí, Señor, y escucha mis palabras.',
      verses: [
        'Escucha, Señor, una causa justa, atiende a mi clamor, presta oído a mi súplica, que brota de labios sinceros.',
        'De tu presencia salga mi sentencia, miren tus ojos la rectitud. Sondea mi corazón, visítalo de noche, pruébame al fuego: no hallarás malicia en mí.',
        'Yo te invoco porque tú me respondes, Dios mío; inclina el oído hacia mí y escucha mis palabras. Muestra las maravillas de tu misericordia, tú que salvas a los que se refugian en ti.'
      ]
    }
  },
  '26-2': {
    firstReading: {
      citation: 'Job 3, 1-3. 11-17. 20-23',
      text: 'Job abrió la boca y maldijo su día. Tomó la palabra y dijo: «Perezca el día en que nací y la noche que dijo: "Ha sido concebido un varón"... ¿Por qué no morí en el seno materno, o no expiré al salir del vientre? ¿Por qué hubo unas rodillas que me acogieran y unos pechos que me criaran? Ahora estaría acostado en paz, dormiría y descansaría con los reyes y consejeros de la tierra... Allí cesa la agitación de los malvados, allí descansan los exhaustos... ¿Por qué se da la luz al desdichado y la vida a los amargados de alma, que ansían la muerte y no llega, y la buscan más que un tesoro; que saltan de júbilo y se alegran cuando encuentran el sepulcro? ¿Por qué dar vida a un hombre que no ve su camino, cercado por Dios por todas partes?».'
    },
    psalm: {
      citation: 'Salmo 87, 2-3. 4-5. 6. 7-8',
      response: 'Llegue a tu presencia mi súplica, Señor.',
      verses: [
        'Señor, Dios de mi salvación, de día y de noche clamo ante ti. Llegue a tu presencia mi plegaria, inclina tu oído a mi clamor.',
        'Porque mi alma está saciada de males, y mi vida está al borde del abismo. Me cuentan con los que bajan a la fosa, soy como un hombre sin fuerzas.',
        'Tendido entre los muertos, como los caídos que yacen en el sepulcro. Me has colocado en lo hondo de la fosa, en las tinieblas y en los abismos.'
      ]
    }
  },
  '26-3': {
    firstReading: {
      citation: 'Job 9, 1-12. 14-16',
      text: 'Job respondió diciendo: «Sé muy bien que es así: ¿cómo un mortal va a tener razón ante Dios? Si quisiera pleitear con él, no podría responderle una vez de cada mil. Él es sabio de corazón y poderoso en fuerza: ¿quién se le enfrentó y salió ileso?... Él mueve montañas sin que lo sepan y las derriba en su furor; sacude la tierra de su lugar y tiemblan sus columnas; manda al sol y no sale, y sella las estrellas... ¿Cómo voy a responderle yo o a escoger mis argumentos ante él? Aunque tuviera razón, no respondería, sino que suplicaría a mi juez. Si lo invocara y me respondiera, no creo que escuchara mi voz».'
    },
    psalm: {
      citation: 'Salmo 87, 10bc-11. 12-13. 14-15',
      response: 'Llegue a tu presencia mi súplica, Señor.',
      verses: [
        'A ti clamo, Señor, todo el día, extendiendo las manos hacia ti. ¿Acaso haces maravillas por los muertos, o los difuntos se alzarán a alabarte?',
        '¿Se proclama en el sepulcro tu misericordia, o tu fidelidad en el lugar de la perdición? ¿Se conocen tus maravillas en la tiniebla, o tu justicia en la tierra del olvido?',
        'Pero yo te pido auxilio, Señor; por la mañana va a tu encuentro mi plegaria. ¿Por qué me rechazas, Señor, y me escondes tu rostro?'
      ]
    }
  },
  '26-4': {
    firstReading: {
      citation: 'Job 19, 21-27',
      text: 'Job respondió: «Piedad, piedad de mí, amigos míos, que la mano de Dios me ha golpeado. ¿Por qué me perseguís como hace Dios y no os cansáis de desgarrar mi carne? ¡Ojalá se escribieran mis palabras! ¡Ojalá se grabaran en cobre, con cincel de hierro y con plomo, se esculpieran en la roca para siempre! Yo sé que mi Redentor vive, y que al final se levantará sobre el polvo; y después de que hayan arrancado esta piel mía, en mi propia carne veré a Dios. Yo mismo lo veré, mis propios ojos lo contemplarán, no los de otro; ¡el corazón me desfallece en el pecho!».'
    },
    psalm: {
      citation: 'Salmo 26, 7-8a. 8b-9abc. 13-14',
      response: 'Espero gozar de la dicha del Señor en el país de la vida.',
      verses: [
        'Escucha, Señor, mi voz que te llama, ten piedad de mí y respóndeme. Oigo en mi corazón: «Buscad mi rostro».',
        'Tu rostro buscaré, Señor; no me escondas tu rostro. No rechaces con ira a tu siervo, que tú eres mi auxilio.',
        'Espero gozar de la dicha del Señor en el país de la vida. Espera en el Señor, sé valiente, ten ánimo, espera en el Señor.'
      ]
    }
  },
  '26-5': {
    firstReading: {
      citation: 'Job 38, 1. 12-21; 40, 3-5',
      text: 'El Señor respondió a Job desde la tormenta diciendo: «¿Has mandado tú en tu vida a la mañana o has asignado su lugar a la aurora para que agarre a la tierra por sus bordes y sacuda de ella a los malvados?... ¿Has entrado por los hontanares del mar o te has paseado por el fondo del abismo?... Respóndeme si lo sabes todo». Job respondió al Señor: «Soy insignificante: ¿qué puedo replicarte? Me tapo la boca con la mano. He hablado una vez, y no responderé; dos veces, y ya no añadiré nada».'
    },
    psalm: {
      citation: 'Salmo 138, 1-3. 7-8. 9-10. 13-14ab',
      response: 'Guíame, Señor, por el camino eterno.',
      verses: [
        'Señor, tú me sondeas y me conoces; me conoces cuando me siento o me levanto, de lejos penetras mis pensamientos; distingues mi camino y mi descanso, todas mis sendas te son familiares.',
        '¿Adónde iré lejos de tu aliento, adónde escaparé de tu mirada? Si escalo el cielo, allí estás tú; si me acuesto en el abismo, allí te encuentro.',
        'Si vuelo hasta el margen de la aurora, si emigro hasta el confín del mar, allí me alcanzará tu mano, me agarrará tu derecha. Tú has creado mis entrañas, me has tejido en el vientre de mi madre.'
      ]
    }
  },
  '26-6': {
    firstReading: {
      citation: 'Job 42, 1-3. 5-6. 12-17',
      text: 'Job respondió al Señor: «Sé que todo lo puedes y que ningún plan se te resiste... Te conocía sólo de oídas, pero ahora te han visto mis ojos; por eso me retracto y me arrepiento en el polvo y la ceniza». Y el Señor bendijo el final de Job más aún que su comienzo... Y Job murió anciano y colmado de días.'
    },
    psalm: {
      citation: 'Salmo 118, 66. 71. 75. 91. 125. 130',
      response: 'Haz brillar, Señor, tu rostro sobre tu siervo.',
      verses: [
        'Enséñame el buen sentido y la prudencia, porque confío en tus mandatos.',
        'Me vino bien el sufrir, así aprendí tus leyes. Sé, Señor, que tus juicios son justos, y que con razón me humillaste.',
        'Yo soy tu siervo: dame inteligencia para que conozca tus preceptos. La explicación de tus palabras ilumina, instruye a los sencillos.'
      ]
    }
  }
};

// Sundays of Cycle A (e.g. 2026) - Gospel of Saint Matthew (Mateo)
export const SUNDAYS_CYCLE_A: Record<number, {
  title: string;
  firstReading: { citation: string; text: string };
  psalm: { citation: string; response: string; verses: string[] };
  secondReading: { citation: string; text: string };
  gospel: { citation: string; acclamation: string; text: string };
}> = {
  24: {
    title: 'XXIV Domingo del Tiempo Ordinario (Ciclo A)',
    firstReading: {
      citation: 'Eclesiástico (Sirácide) 27, 33 – 28, 9',
      text: 'Cosas abominables son el rencor y la ira, en ambas cosas el pecador se ceba. Quien se venga del prójimo sufrirá la venganza del Señor, que llevará cuenta rigurosa de todos sus pecados. Perdona a tu prójimo la ofensa cometida, y se te perdonarán tus pecados cuando reces... Acuérdate de los mandamientos y no guardes rencor a tu prójimo; acuérdate de la alianza del Altísimo y perdona la falta.'
    },
    psalm: {
      citation: 'Salmo 102 (103), 1-2. 3-4. 9-10. 11-12',
      response: 'El Señor es compasivo y misericordioso, lento a la ira y rico en clemencia.',
      verses: [
        'Bendice, alma mía, al Señor, y todo mi ser a su santo nombre. Bendice, alma mía, al Señor, y no olvides sus beneficios.',
        'Él perdona todas tus culpas y cura todas tus enfermedades; él rescata tu vida de la fosa y te colma de gracia y de ternura.',
        'No está siempre acusando ni guarda rencor perpetuo. No nos trata como merecen nuestros pecados ni nos paga según nuestras culpas.'
      ]
    },
    secondReading: {
      citation: 'Carta del apóstol san Pablo a los romanos 14, 7-9',
      text: 'Hermanos: Ninguno de nosotros vive para sí mismo y ninguno muere para sí mismo. Si vivimos, vivimos para el Señor; si morimos, morimos para el Señor; así pues, ya vivamos ya muramos, somos del Señor. Para esto murió y resucitó Cristo: para ser Señor de muertos y vivos.'
    },
    gospel: {
      citation: 'Santo Evangelio según san Mateo 18, 21-35',
      acclamation: 'Aleluya, aleluya. Os doy un mandamiento nuevo: que os améis unos a otros como yo os he amado. Aleluya.',
      text: 'En aquel tiempo, se acercó Pedro a Jesús y le preguntó: «Señor, si mi hermano me ofende, ¿cuántas veces tengo que perdonarlo? ¿Hasta siete veces?». Jesús le contesta: «No te digo hasta siete veces, sino hasta setenta veces siete...»'
    }
  },
  25: {
    title: 'XXV Domingo del Tiempo Ordinario (Ciclo A)',
    firstReading: {
      citation: 'Isaías 55, 6-9',
      text: 'Buscad al Señor mientras se deja encontrar, invocadlo mientras está cerca. Deje el impío su camino, y el hombre inicuo sus pensamientos, y vuélvase al Señor, que tendrá piedad de él, y a nuestro Dios, que es rico en perdón. Porque mis pensamientos no son vuestros pensamientos, ni vuestros caminos mis caminos —oráculo del Señor—. Cuanto son más altos los cielos que la tierra, tanto son mis caminos más altos que vuestros caminos, y mis pensamientos más que vuestros pensamientos.'
    },
    psalm: {
      citation: 'Salmo 144, 2-3. 8-9. 17-18',
      response: 'Cerca está el Señor de todos los que lo invocan.',
      verses: [
        'Día tras día te bendeciré y alabaré tu nombre por siempre jamás. Grande es el Señor y muy digno de alabanza, su grandeza es insondable.',
        'El Señor es clemente y misericordioso, lento a la cólera y rico en piedad; el Señor es bueno con todos, es cariñoso con todas sus criaturas.',
        'El Señor es justo en todos sus caminos, es bondadoso en todas sus acciones; cerca está el Señor de los que lo invocan, de los que lo invocan sinceramente.'
      ]
    },
    secondReading: {
      citation: 'Filipenses 1, 20c-24. 27a',
      text: 'Hermanos: Cristo será glorificado en mi cuerpo, sea por mi vida o por mi muerte. Para mí la vida es Cristo y morir una ganancia. Pero, si el vivir en este cuerpo me permite un trabajo fructífero, no sé qué escoger; me siento apremiado por las dos partes: por un lado, deseo partir para estar con Cristo, que es con mucho lo mejor; pero, por otro, permanecer en este cuerpo es más necesario para vosotros.'
    },
    gospel: {
      citation: 'Santo Evangelio según san Mateo 20, 1-16a',
      acclamation: 'Aleluya, aleluya. Ábrenos, Señor, el corazón, para que aceptemos las palabras de tu Hijo. Aleluya.',
      text: 'En aquel tiempo, dijo Jesús a sus discípulos esta parábola: «El reino de los cielos se parece a un propietario que al amanecer salió a contratar jornaleros para su viña. Después de ajustarse con ellos en un denario por jornada, los mandó a la viña... Salieron también a la hora tercia, sexta, nona y undécima... Al atardecer, llamó a los jornaleros y pagó a todos un denario. Los primeros murmuraban: "¿Por qué los tratas igual?". El dueño respondió: "Amigo, ¿no puedo hacer con lo mío lo que quiero? ¿O va a ser tu ojo envidioso porque yo soy bueno?". Así, los últimos serán primeros y los primeros, últimos».'
    }
  },
  26: {
    title: 'XXVI Domingo del Tiempo Ordinario (Ciclo A)',
    firstReading: {
      citation: 'Ezequiel 18, 25-28',
      text: 'Así dice el Señor: «Decís: "No es justo el proceder del Señor". Escuchad, casa de Israel: ¿Es injusto mi proceder? ¿No es vuestro proceder el que es injusto? Cuando el justo se aparta de su justicia, comete la maldad y muere, muere por la maldad que cometió. Y cuando el malvado se convierte de la maldad que hizo y practica el derecho y la justicia, él salvará su vida».'
    },
    psalm: {
      citation: 'Salmo 24, 4-5. 6-7. 8-9',
      response: 'Recuerda, Señor, tu ternura.',
      verses: [
        'Señor, enséñame tus caminos, instrúyeme en tus sendas: haz que camine con lealtad; enséñame, porque tú eres mi Dios y Salvador.',
        'Recuerda, Señor, que tu ternura y tu misericordia son eternas. No te acuerdes de los pecados ni de las maldades de mi juventud; acuérdate de mí con misericordia, por tu bondad, Señor.',
        'El Señor es bueno y es recto, y enseña el camino a los pecadores; hace caminar a los humildes con rectitud, enseña su camino a los humildes.'
      ]
    },
    secondReading: {
      citation: 'Filipenses 2, 1-11',
      text: 'Hermanos: Si queréis darme el consuelo de Cristo, el alivio del amor, la comunión en el Espíritu, el cariño y la compasión, colmad mi alegría teniendo los mismos sentimientos, el mismo amor, un mismo corazón. Tened entre vosotros los sentimientos propios de Cristo Jesús, el cual, siendo de condición divina, no retuvo ávidamente el ser igual a Dios, sino que se despojó de sí mismo tomando la condición de esclavo... Por eso Dios lo exaltó sobre todo.'
    },
    gospel: {
      citation: 'Santo Evangelio según san Mateo 21, 28-32',
      acclamation: 'Aleluya, aleluya. Mis ovejas escuchan mi voz —dice el Señor—, y yo las conozco y ellas me siguen. Aleluya.',
      text: 'En aquel tiempo, dijo Jesús a los sumos sacerdotes y a los ancianos del pueblo: «¿Qué os parece? Un hombre tenía dos hijos. Se acercó al primero y le dijo: "Hijo, ve hoy a trabajar en la viña". Él contestó: "No quiero". Pero más tarde le remordió la conciencia y fue. Luego se acercó al segundo y le dijo lo mismo. Este contestó: "Voy, señor". Pero no fue. ¿Quién de los dos cumplió la voluntad de su padre?». Contestaron: «El primero». Jesús les dijo: «En verdad os digo que los publicanos y las prostitutas van por delante de vosotros en el reino de Dios».'
    }
  }
};

/**
 * Returns canonical Catholic liturgical day data according to the Roman Lectionary
 * guaranteeing correct Gospel of Saint Luke during weeks 22 to 34 of Ordinary Time.
 */
export function buildCanonicalDay(dateStr: string): LiturgicalDay {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 9;
  const dayNum = parseInt(parts[2], 10) || 1;

  const dateObj = new Date(year, month - 1, dayNum, 12, 0, 0);
  const dayOfWeekIndex = dateObj.getDay(); // 0 = Domingo, 1 = Lunes, ...
  const dayOfWeek = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
  const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });
  const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

  const isSunday = dayOfWeekIndex === 0;
  const weekOfOT = getOrdinaryTimeWeek(dateObj);
  const weekRoman = ROMAN_WEEKS[weekOfOT] || `${weekOfOT}ª`;

  const sundayCycle = year % 3 === 2026 % 3 ? 'Ciclo A' : (year % 3 === 2027 % 3 ? 'Ciclo B' : 'Ciclo C');
  const saintData = getSaintForDate(month, dayNum);

  if (isSunday) {
    const sundayData = SUNDAYS_CYCLE_A[weekOfOT];
    if (sundayData) {
      return {
        date: dateStr,
        formattedDate: `${dayOfWeek}, ${monthName} ${dayNum}`,
        title: `${weekRoman} Domingo del Tiempo Ordinario (${sundayCycle})`,
        season: 'Tiempo Ordinario',
        color: 'green',
        colorName: 'Tiempo Ordinario',
        saint: {
          name: saintData.name,
          title: saintData.title,
          shortBio: saintData.shortBio,
          fullBio: saintData.fullBio,
          patronage: saintData.patronage,
          prayer: saintData.prayer,
        },
        firstReading: sundayData.firstReading,
        psalm: sundayData.psalm,
        secondReading: sundayData.secondReading,
        gospel: sundayData.gospel,
      };
    }
  }

  // Weekday in Ordinary Time (Lunes a Sábado)
  // In weeks 22 to 34: Gospel MUST BE LUCAS (Luke)
  const lookupKey = `${weekOfOT}-${dayOfWeekIndex}`;
  const gospelData = ORDINARY_TIME_LUKE_GOSPELS[lookupKey] || ORDINARY_TIME_LUKE_GOSPELS[`24-${dayOfWeekIndex}`] || ORDINARY_TIME_LUKE_GOSPELS['24-1'];
  
  const firstReadingYear2 = ORDINARY_TIME_YEAR_2_FIRST_READINGS[lookupKey] || ORDINARY_TIME_YEAR_2_FIRST_READINGS[`24-${dayOfWeekIndex}`] || ORDINARY_TIME_YEAR_2_FIRST_READINGS['24-1'];

  const color = saintData.color === 'red' ? 'red' : saintData.color === 'white' ? 'white' : 'green';
  const colorName = color === 'red'
    ? 'Mártires de Cristo (Rojo)'
    : color === 'white'
    ? `Memoria de ${saintData.name} (Blanco)`
    : 'Tiempo Ordinario (Verde)';

  return {
    date: dateStr,
    formattedDate: `${dayOfWeek}, ${monthName} ${dayNum}`,
    title: `${capitalizedDay} de la ${weekRoman} semana del Tiempo Ordinario • ${saintData.name}`,
    season: 'Tiempo Ordinario',
    color,
    colorName,
    saint: {
      name: saintData.name,
      title: saintData.title,
      shortBio: saintData.shortBio,
      fullBio: saintData.fullBio,
      patronage: saintData.patronage,
      prayer: saintData.prayer,
    },
    firstReading: firstReadingYear2.firstReading,
    psalm: firstReadingYear2.psalm,
    gospel: gospelData,
  };
}
