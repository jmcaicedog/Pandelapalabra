import { getSaintForDate } from './saintsCalendar.js';
import type { LiturgicalDay } from './liturgy.js';
import {
  buildSeasonalTitle,
  getColorName,
  getLiturgicalCalendarInfo,
  resolveLiturgicalColor,
} from './liturgicalCalendar.js';

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

// Week of Ordinary Time for any date (0 when the date falls outside Ordinary Time)
export function getOrdinaryTimeWeek(date: Date): number {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const info = getLiturgicalCalendarInfo(dateStr);
  return info.season === 'Tiempo Ordinario' ? info.week : 0;
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
      citation: 'Salmo 32, 2-3. 4-5. 12 y 22',
      response: 'Dichoso el pueblo que el Señor se escogió como heredad.',
      verses: [
        'Dad gracias al Señor con la cítara, tocad en su honor el arpa de diez cuerdas; cantadle un cántico nuevo, acompañando los vítores con bordones.',
        'La palabra del Señor es sincera, y todas sus acciones son leales; él ama la justicia y el derecho, y su misericordia llena la tierra.',
        'Dichosa la nación cuyo Dios es el Señor, el pueblo que él se escogió como heredad. Que tu misericordia, Señor, venga sobre nosotros, como lo esperamos de ti.'
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
  },

  // Semana 27 (Año II - Carta a los Gálatas)
  '27-1': {
    firstReading: {
      citation: 'Gálatas 1, 6-12',
      text: 'Hermanos: Me maravillo de que tan pronto os hayáis apartado del que os llamó por la gracia de Cristo, para pasaros a otro evangelio. No es que haya otro, sino que hay algunos que os perturban y quieren deformar el Evangelio de Cristo. Pero si alguien —nosotros mismos o un ángel del cielo— os anunciara un evangelio distinto del que os hemos anunciado, ¡sea anatema!... Os hago saber, hermanos, que el Evangelio anunciado por mí no es de origen humano; pues yo no lo he recibido ni aprendido de ningún hombre, sino por revelación de Jesucristo.'
    },
    psalm: {
      citation: 'Salmo 110, 1-2. 7-9. 10c',
      response: 'El Señor recuerda siempre su alianza.',
      verses: [
        'Doy gracias al Señor de todo corazón, en compañía de los rectos, en la asamblea. Grandes son las obras del Señor, dignas de estudio para los que las aman.',
        'Justicia y verdad son las obras de sus manos, todos sus preceptos merecen confianza: son estables para siempre jamás, se han de cumplir con verdad y rectitud.',
        'Envió la redención a su pueblo, ratificó para siempre su alianza; su nombre es sagrado y temible. La alabanza del Señor dura por siempre.'
      ]
    }
  },
  '27-2': {
    firstReading: {
      citation: 'Gálatas 1, 13-24',
      text: 'Hermanos: Habéis oído hablar de mi conducta pasada en el judaísmo: con qué saña perseguía a la Iglesia de Dios y la asolaba... Pero cuando Aquel que me separó desde el seno de mi madre y me llamó por su gracia se dignó revelar a su Hijo en mí, para que lo anunciara entre los gentiles, no consulté con hombres de carne y hueso... Más tarde, pasados tres años, subí a Jerusalén para conocer a Cefas y permanecí quince días con él... Las Iglesias de Judea solo habían oído decir: «El que antes nos perseguía, ahora anuncia la fe que antes intentaba destruir»; y glorificaban a Dios por causa mía.'
    },
    psalm: {
      citation: 'Salmo 138, 1-3. 13-14ab. 14c-15',
      response: 'Guíame, Señor, por el camino eterno.',
      verses: [
        'Señor, tú me sondeas y me conoces; me conoces cuando me siento o me levanto, de lejos penetras mis pensamientos; distingues mi camino y mi descanso, todas mis sendas te son familiares.',
        'Tú has creado mis entrañas, me has tejido en el seno materno. Te doy gracias, porque me has escogido portentosamente, porque son admirables tus obras.',
        'Conocías hasta el fondo de mi alma, no desconocías mis huesos, cuando, en lo oculto, me iba formando, y entretejiendo en lo profundo de la tierra.'
      ]
    }
  },
  '27-3': {
    firstReading: {
      citation: 'Gálatas 2, 1-2. 7-14',
      text: 'Hermanos: Al cabo de catorce años, subí de nuevo a Jerusalén con Bernabé, llevando también a Tito. Subí por una revelación y les expuse el Evangelio que predico entre los gentiles... Vieron que se me había encomendado el Evangelio de la incircuncisión, así como a Pedro el de la circuncisión... Santiago, Cefas y Juan, considerados como columnas, nos dieron la mano en señal de comunión a Bernabé y a mí... Pero cuando Cefas llegó a Antioquía, tuve que enfrentarme con él cara a cara, porque era reprensible... Cuando vi que no andaban rectamente según la verdad del Evangelio, le dije a Cefas delante de todos: «Si tú, siendo judío, vives como un gentil y no como un judío, ¿cómo obligas a los gentiles a judaizar?».'
    },
    psalm: {
      citation: 'Salmo 116, 1. 2',
      response: 'Id al mundo entero y proclamad el Evangelio.',
      verses: [
        'Alabad al Señor todas las naciones, aclamadlo todos los pueblos.',
        'Firme es su misericordia con nosotros, su fidelidad dura por siempre.'
      ]
    }
  },
  '27-4': {
    firstReading: {
      citation: 'Gálatas 3, 1-5',
      text: '¡Insensatos gálatas! ¿Quién os ha embrujado a vosotros, ante cuyos ojos fue presentado Jesucristo crucificado? Solo quiero saber esto de vosotros: ¿recibisteis el Espíritu por las obras de la ley o por haber escuchado con fe? ¿Tan insensatos sois? ¿Comenzasteis por el Espíritu para terminar ahora con la carne?... El que os concede el Espíritu y obra milagros entre vosotros, ¿lo hace por las obras de la ley o por haber escuchado con fe?'
    },
    psalm: {
      citation: 'Lucas 1, 69-70. 71-72. 73-75',
      response: 'Bendito sea el Señor, Dios de Israel, porque ha visitado a su pueblo.',
      verses: [
        'Nos ha suscitado una fuerza de salvación en la casa de David, su siervo, según lo había predicho desde antiguo por boca de sus santos profetas.',
        'Es la salvación que nos libra de nuestros enemigos y de la mano de todos los que nos odian; realizando la misericordia que tuvo con nuestros padres, recordando su santa alianza.',
        'Y el juramento que juró a nuestro padre Abrahán. Para concedernos que, libres de temor, arrancados de la mano de los enemigos, le sirvamos con santidad y justicia, en su presencia, todos nuestros días.'
      ]
    }
  },
  '27-5': {
    firstReading: {
      citation: 'Gálatas 3, 7-14',
      text: 'Hermanos: Reconoced que hijos de Abrahán son los que viven de la fe. La Escritura, previendo que Dios justificaría a los gentiles por la fe, anunció de antemano a Abrahán: «En ti serán bendecidas todas las naciones». Así pues, los que viven de la fe son bendecidos con Abrahán, el creyente... Cristo nos rescató de la maldición de la ley, haciéndose por nosotros maldición... para que la bendición de Abrahán alcanzara a los gentiles en Cristo Jesús, y para que recibiéramos por la fe la promesa del Espíritu.'
    },
    psalm: {
      citation: 'Salmo 110, 1-2. 3-4. 5-6',
      response: 'El Señor recuerda siempre su alianza.',
      verses: [
        'Doy gracias al Señor de todo corazón, en compañía de los rectos, en la asamblea. Grandes son las obras del Señor, dignas de estudio para los que las aman.',
        'Esplendor y belleza son su obra, su generosidad dura por siempre; ha hecho maravillas memorables, el Señor es piadoso y clemente.',
        'Él da alimento a sus fieles, recordando siempre su alianza; mostró a su pueblo la fuerza de su poder, dándoles la heredad de los gentiles.'
      ]
    }
  },
  '27-6': {
    firstReading: {
      citation: 'Gálatas 3, 22-29',
      text: 'Hermanos: La Escritura encerró todo bajo el pecado, para que la promesa se diera a los creyentes por la fe en Jesucristo. Antes de que llegara la fe, estábamos custodiados bajo la ley... De modo que la ley fue nuestro pedagogo hasta Cristo, para que fuéramos justificados por la fe... Pues todos sois hijos de Dios por la fe en Cristo Jesús. Los que habéis sido bautizados en Cristo, os habéis revestido de Cristo. No hay judío y griego, esclavo y libre, hombre y mujer, porque todos vosotros sois uno en Cristo Jesús. Y si sois de Cristo, sois descendencia de Abrahán y herederos según la promesa.'
    },
    psalm: {
      citation: 'Salmo 104, 2-3. 4-5. 6-7',
      response: 'El Señor se acuerda de su alianza eternamente.',
      verses: [
        'Cantadle al son de instrumentos, hablad de sus maravillas; gloriaos de su nombre santo, que se alegren los que buscan al Señor.',
        'Recurrid al Señor y a su poder, buscad continuamente su rostro. Recordad las maravillas que hizo, sus prodigios, las sentencias de su boca.',
        '¡Estirpe de Abrahán, su siervo; hijos de Jacob, su elegido! El Señor es nuestro Dios, él gobierna toda la tierra.'
      ]
    }
  },

  // Semana 28 (Año II - Gálatas y Efesios)
  '28-1': {
    firstReading: {
      citation: 'Gálatas 4, 22-24. 26-27. 31 — 5, 1',
      text: 'Hermanos: Está escrito que Abrahán tuvo dos hijos, uno de la esclava y otro de la libre. El de la esclava nació según la carne; el de la libre, en virtud de la promesa. Esto tiene un sentido alegórico: estas mujeres representan dos alianzas... La Jerusalén de arriba es libre, y esa es nuestra madre... Así pues, hermanos, no somos hijos de la esclava, sino de la libre. Para la libertad nos ha liberado Cristo. Manteneos, pues, firmes, y no os sometáis de nuevo al yugo de la esclavitud.'
    },
    psalm: {
      citation: 'Salmo 112, 1-2. 3-4. 5a y 6-7',
      response: 'Bendito sea el nombre del Señor, por siempre.',
      verses: [
        'Alabad, siervos del Señor, alabad el nombre del Señor. Bendito sea el nombre del Señor, ahora y por siempre.',
        'De la salida del sol hasta su ocaso, alabado sea el nombre del Señor. El Señor se eleva sobre todos los pueblos, su gloria sobre los cielos.',
        '¿Quién como el Señor, Dios nuestro, que se abaja para mirar al cielo y a la tierra? Levanta del polvo al desvalido, alza de la basura al pobre.'
      ]
    }
  },
  '28-2': {
    firstReading: {
      citation: 'Gálatas 5, 1-6',
      text: 'Hermanos: Para la libertad nos ha liberado Cristo. Manteneos, pues, firmes, y no dejéis que vuelvan a someteros a yugos de esclavitud. Mirad: yo, Pablo, os digo que, si os circuncidáis, Cristo no os servirá de nada... Nosotros, en cambio, aguardamos por el Espíritu, desde la fe, la esperanza de la justicia. Porque en Cristo Jesús lo mismo da estar circuncidado o no estarlo; lo único que cuenta es la fe que actúa por el amor.'
    },
    psalm: {
      citation: 'Salmo 118, 41. 43. 44. 45. 47. 48',
      response: 'Señor, que me alcance tu favor.',
      verses: [
        'Señor, que me alcance tu favor, tu salvación según tu promesa. No quites de mi boca las palabras sinceras, porque yo espero en tus mandamientos.',
        'Cumpliré sin cesar tu voluntad, por siempre jamás. Andaré por un camino ancho, buscando tus decretos.',
        'Serán mi delicia tus mandatos, que tanto amo. Levantaré mis manos hacia ti recitando tus mandatos.'
      ]
    }
  },
  '28-3': {
    firstReading: {
      citation: 'Gálatas 5, 18-25',
      text: 'Hermanos: Si os guía el Espíritu, no estáis bajo la ley. Las obras de la carne están patentes: fornicación, impureza, libertinaje, idolatría, hechicería, enemistades, discordia, envidia, cólera, ambiciones, divisiones, disensiones, rivalidades, borracheras, orgías y cosas por el estilo... En cambio, el fruto del Espíritu es: amor, alegría, paz, paciencia, afabilidad, bondad, lealtad, modestia, dominio de sí. Contra estas cosas no hay ley. Y los que son de Cristo Jesús han crucificado la carne con sus pasiones y concupiscencias. Si vivimos por el Espíritu, marchemos tras el Espíritu.'
    },
    psalm: {
      citation: 'Salmo 1, 1-2. 3. 4 y 6',
      response: 'El que te sigue, Señor, tendrá la luz de la vida.',
      verses: [
        'Dichoso el hombre que no sigue el consejo de los impíos, ni entra por la senda de los pecadores, ni se sienta en la reunión de los cínicos; sino que su gozo es la ley del Señor, y medita su ley día y noche.',
        'Será como un árbol plantado al borde de la acequia: da fruto en su sazón y no se marchitan sus hojas; y cuanto emprende tiene buen fin.',
        'No así los impíos, no así; serán paja que arrebata el viento. Porque el Señor protege el camino de los justos, pero el camino de los impíos acaba mal.'
      ]
    }
  },
  '28-4': {
    firstReading: {
      citation: 'Efesios 1, 1-10',
      text: 'Pablo, apóstol de Cristo Jesús por voluntad de Dios, a los santos que viven en Éfeso y creen en Cristo Jesús: gracia y paz de parte de Dios, nuestro Padre, y del Señor Jesucristo. Bendito sea Dios, Padre de nuestro Señor Jesucristo, que nos ha bendecido en Cristo con toda clase de bendiciones espirituales en los cielos. Él nos eligió en Cristo antes de la fundación del mundo para que fuésemos santos e intachables ante él por el amor. Él nos ha destinado por medio de Jesucristo, según el beneplácito de su voluntad, a ser sus hijos... En él, por su sangre, tenemos la redención, el perdón de los pecados... recapitular en Cristo todas las cosas del cielo y de la tierra.'
    },
    psalm: {
      citation: 'Salmo 97, 1. 2-3ab. 3cd-4. 5-6',
      response: 'El Señor da a conocer su victoria.',
      verses: [
        'Cantad al Señor un cántico nuevo, porque ha hecho maravillas: su diestra le ha dado la victoria, su santo brazo.',
        'El Señor da a conocer su victoria, revela a las naciones su justicia: se acordó de su misericordia y su fidelidad en favor de la casa de Israel.',
        'Los confines de la tierra han contemplado la victoria de nuestro Dios. Aclama al Señor, tierra entera; gritad, vitoread, tocad.'
      ]
    }
  },
  '28-5': {
    firstReading: {
      citation: 'Efesios 1, 11-14',
      text: 'Hermanos: En Cristo hemos heredado también nosotros, los que ya estábamos destinados por decisión del que lo hace todo según su voluntad, para que seamos alabanza de su gloria quienes antes esperábamos en el Mesías. En él también vosotros, después de haber escuchado la palabra de la verdad —el evangelio de vuestra salvación—, creyendo en él habéis sido marcados con el sello del Espíritu Santo prometido. Él es prenda de nuestra herencia, mientras llega la redención del pueblo de su propiedad, para alabanza de su gloria.'
    },
    psalm: {
      citation: 'Salmo 32, 1-2. 4-5. 12-13',
      response: 'Dichoso el pueblo que el Señor se escogió como heredad.',
      verses: [
        'Aclamad, justos, al Señor, que merece la alabanza de los buenos. Dad gracias al Señor con la cítara, tocad en su honor el arpa de diez cuerdas.',
        'La palabra del Señor es sincera, y todas sus acciones son leales; él ama la justicia y el derecho, y su misericordia llena la tierra.',
        'Dichosa la nación cuyo Dios es el Señor, el pueblo que él se escogió como heredad. El Señor mira desde el cielo, se fija en todos los hombres.'
      ]
    }
  },
  '28-6': {
    firstReading: {
      citation: 'Efesios 1, 15-23',
      text: 'Hermanos: Habiendo oído hablar de vuestra fe en el Señor Jesús y de vuestro amor a todos los santos, no ceso de dar gracias por vosotros, recordándoos en mi oración, a fin de que el Dios de nuestro Señor Jesucristo, el Padre de la gloria, os dé espíritu de sabiduría y revelación para conocerlo... Según la eficacia de la fuerza poderosa que desplegó en Cristo, resucitándolo de entre los muertos y sentándolo a su derecha en el cielo... Y todo lo puso bajo sus pies, y lo dio a la Iglesia como cabeza, sobre todo. Ella es su cuerpo, plenitud del que llena todo en todos.'
    },
    psalm: {
      citation: 'Salmo 8, 2-3a. 4-5. 6-7',
      response: 'Diste a tu Hijo el mando sobre las obras de tus manos.',
      verses: [
        '¡Señor, Dios nuestro, qué admirable es tu nombre en toda la tierra! Ensalzaste tu majestad sobre los cielos. De la boca de los niños de pecho has sacado una alabanza.',
        'Cuando contemplo el cielo, obra de tus dedos, la luna y las estrellas que has creado, ¿qué es el hombre, para que te acuerdes de él; el ser humano, para darle poder?',
        'Lo hiciste poco inferior a los ángeles, lo coronaste de gloria y dignidad; le diste el mando sobre las obras de tus manos, todo lo sometiste bajo sus pies.'
      ]
    }
  },

  // Semana 29 (Año II - Efesios)
  '29-1': {
    firstReading: {
      citation: 'Efesios 2, 1-10',
      text: 'Hermanos: Vosotros estabais muertos por vuestras culpas y pecados... Pero Dios, rico en misericordia, por el gran amor con que nos amó, estando nosotros muertos por los pecados, nos ha hecho revivir con Cristo —estáis salvados por pura gracia—; nos ha resucitado con Cristo Jesús y nos ha sentado en el cielo con él... Porque estáis salvados por su gracia, mediante la fe. Y esto no viene de vosotros: es don de Dios. Tampoco viene de las obras, para que nadie pueda presumir. Somos, pues, obra suya. Dios nos ha creado en Cristo Jesús para que nos dediquemos a las buenas obras, que de antemano dispuso él que practicásemos.'
    },
    psalm: {
      citation: 'Salmo 99, 2. 3. 4. 5',
      response: 'El Señor nos hizo y somos suyos.',
      verses: [
        'Aclama al Señor, tierra entera, servid al Señor con alegría, entrad en su presencia con vítores.',
        'Sabed que el Señor es Dios: que él nos hizo y somos suyos, su pueblo y ovejas de su rebaño. Entrad por sus puertas con acción de gracias, por sus atrios con himnos.',
        'Dándole gracias y bendiciendo su nombre: «El Señor es bueno, su misericordia es eterna, su fidelidad por todas las edades».'
      ]
    }
  },
  '29-2': {
    firstReading: {
      citation: 'Efesios 2, 12-22',
      text: 'Hermanos: En aquel tiempo estabais sin Cristo, excluidos de la ciudadanía de Israel y ajenos a las alianzas de la promesa, sin esperanza y sin Dios en el mundo. Ahora, en cambio, en Cristo Jesús, los que antes estabais lejos estáis cerca por la sangre de Cristo. Él es nuestra paz: el que de los dos pueblos ha hecho uno, derribando en su cuerpo de carne el muro que los separaba: la enemistad... Así, pues, ya no sois extranjeros ni forasteros, sino conciudadanos de los santos y miembros de la familia de Dios. Estáis edificados sobre el cimiento de los apóstoles y profetas, y el mismo Cristo Jesús es la piedra angular.'
    },
    psalm: {
      citation: 'Salmo 84, 9ab-10. 11-12. 13-14',
      response: 'Dios anuncia la paz a su pueblo.',
      verses: [
        'Voy a escuchar lo que dice el Señor: «Dios anuncia la paz a su pueblo y a sus amigos». La salvación está cerca de los que lo temen, y la gloria habitará en nuestra tierra.',
        'La misericordia y la fidelidad se encuentran, la justicia y la paz se besan; la fidelidad brota de la tierra, y la justicia mira desde el cielo.',
        'El Señor nos dará la lluvia, y nuestra tierra dará su fruto. La justicia marchará ante él, la salvación seguirá sus pasos.'
      ]
    }
  },
  '29-3': {
    firstReading: {
      citation: 'Efesios 3, 2-12',
      text: 'Hermanos: Habéis oído hablar de la distribución de la gracia de Dios que se me ha dado en favor vuestro. Ya que se me dio a conocer por revelación el misterio... que no había sido manifestado a los hombres en otros tiempos, como ha sido revelado ahora por el Espíritu a sus santos apóstoles y profetas: que también los gentiles son coherederos, miembros del mismo cuerpo y partícipes de la misma promesa en Jesucristo, por el Evangelio... A mí, el más insignificante de los santos, se me ha dado la gracia de anunciar a los gentiles la riqueza insondable de Cristo.'
    },
    psalm: {
      citation: 'Isaías 12, 2-3. 4bcd. 5-6',
      response: 'Sacaréis aguas con gozo de las fuentes de la salvación.',
      verses: [
        'Él es mi Dios y Salvador: confiaré y no temeré, porque mi fuerza y mi poder es el Señor, él fue mi salvación. Y sacaréis aguas con gozo de las fuentes de la salvación.',
        'Dad gracias al Señor, invocad su nombre, contad a los pueblos sus hazañas, proclamad que su nombre es excelso.',
        'Tañed para el Señor, que hizo proezas, anunciadlas a toda la tierra; gritad jubilosos, habitantes de Sión, porque es grande en medio de ti el Santo de Israel.'
      ]
    }
  },
  '29-4': {
    firstReading: {
      citation: 'Efesios 3, 14-21',
      text: 'Hermanos: Doblo las rodillas ante el Padre, de quien toma nombre toda familia en el cielo y en la tierra, pidiéndole que, conforme a la riqueza de su gloria, os conceda ser robustecidos por medio de su Espíritu en vuestro hombre interior; que Cristo habite por la fe en vuestros corazones; que el amor sea vuestra raíz y vuestro cimiento; de modo que así, con todos los santos, logréis abarcar lo ancho, lo largo, lo alto y lo profundo, comprendiendo el amor de Cristo, que trasciende todo conocimiento. Así llegaréis a vuestra plenitud, según la plenitud total de Dios.'
    },
    psalm: {
      citation: 'Salmo 32, 1-2. 4-5. 11-12. 18-19',
      response: 'La misericordia del Señor llena la tierra.',
      verses: [
        'Aclamad, justos, al Señor, que merece la alabanza de los buenos. Dad gracias al Señor con la cítara, tocad en su honor el arpa de diez cuerdas.',
        'La palabra del Señor es sincera, y todas sus acciones son leales; él ama la justicia y el derecho, y su misericordia llena la tierra.',
        'Los ojos del Señor están puestos en sus fieles, en los que esperan en su misericordia, para librar sus vidas de la muerte y reanimarlos en tiempo de hambre.'
      ]
    }
  },
  '29-5': {
    firstReading: {
      citation: 'Efesios 4, 1-6',
      text: 'Hermanos: Yo, el prisionero por el Señor, os ruego que andéis como pide la vocación a la que habéis sido convocados. Sed siempre humildes y amables, sed comprensivos, sobrellevaos mutuamente con amor; esforzaos en mantener la unidad del Espíritu con el vínculo de la paz. Un solo cuerpo y un solo Espíritu, como una sola es la esperanza de la vocación a la que habéis sido convocados. Un Señor, una fe, un bautismo. Un Dios, Padre de todo, que está sobre todo, actúa por medio de todo y está en todo.'
    },
    psalm: {
      citation: 'Salmo 23, 1-2. 3-4ab. 5-6',
      response: 'Este es el grupo que viene a tu presencia, Señor.',
      verses: [
        'Del Señor es la tierra y cuanto la llena, el orbe y todos sus habitantes: él la fundó sobre los mares, él la afianzó sobre los ríos.',
        '¿Quién puede subir al monte del Señor? ¿Quién puede estar en el recinto sacro? El hombre de manos inocentes y puro corazón, que no confía en los ídolos.',
        'Ese recibirá la bendición del Señor, le hará justicia el Dios de salvación. Este es el grupo que busca al Señor, que viene a tu presencia, Dios de Jacob.'
      ]
    }
  },
  '29-6': {
    firstReading: {
      citation: 'Efesios 4, 7-16',
      text: 'Hermanos: A cada uno de nosotros se le ha dado la gracia según la medida del don de Cristo... Y él ha constituido a unos, apóstoles; a otros, profetas; a otros, evangelizadores; a otros, pastores y doctores, para el perfeccionamiento de los santos, en función de su ministerio, y para la edificación del cuerpo de Cristo; hasta que lleguemos todos a la unidad en la fe y en el conocimiento del Hijo de Dios, al Hombre perfecto, a la medida de Cristo en su plenitud... Realizando la verdad en el amor, hagamos crecer todas las cosas hacia él, que es la cabeza: Cristo.'
    },
    psalm: {
      citation: 'Salmo 121, 1-2. 3-4a. 4b-5',
      response: 'Vamos alegres a la casa del Señor.',
      verses: [
        '¡Qué alegría cuando me dijeron: «Vamos a la casa del Señor»! Ya están pisando nuestros pies tus umbrales, Jerusalén.',
        'Jerusalén está fundada como ciudad bien compacta. Allá suben las tribus, las tribus del Señor.',
        'Según la costumbre de Israel, a celebrar el nombre del Señor; en ella están los tribunales de justicia, en el palacio de David.'
      ]
    }
  },

  // Semana 30 (Año II - Efesios y Filipenses)
  '30-1': {
    firstReading: {
      citation: 'Efesios 4, 32 — 5, 8',
      text: 'Hermanos: Sed buenos, comprensivos, perdonándoos unos a otros como Dios os perdonó en Cristo. Sed imitadores de Dios, como hijos queridos, y vivid en el amor como Cristo os amó y se entregó por nosotros como oblación y víctima de suave olor... Antes erais tinieblas, pero ahora sois luz por el Señor. Caminad como hijos de la luz.'
    },
    psalm: {
      citation: 'Salmo 1, 1-2. 3. 4 y 6',
      response: 'Seamos imitadores de Dios, como hijos queridos.',
      verses: [
        'Dichoso el hombre que no sigue el consejo de los impíos, ni entra por la senda de los pecadores, ni se sienta en la reunión de los cínicos; sino que su gozo es la ley del Señor, y medita su ley día y noche.',
        'Será como un árbol plantado al borde de la acequia: da fruto en su sazón y no se marchitan sus hojas; y cuanto emprende tiene buen fin.',
        'No así los impíos, no así; serán paja que arrebata el viento. Porque el Señor protege el camino de los justos, pero el camino de los impíos acaba mal.'
      ]
    }
  },
  '30-2': {
    firstReading: {
      citation: 'Efesios 5, 21-33',
      text: 'Hermanos: Sed sumisos unos a otros con respeto cristiano... Maridos, amad a vuestras mujeres como Cristo amó a su Iglesia y se entregó a sí mismo por ella, para consagrarla, purificándola con el baño del agua y la palabra, y para presentársela gloriosa, sin mancha ni arruga ni nada semejante, sino santa e inmaculada... «Por eso abandonará el hombre a su padre y a su madre, se unirá a su mujer y serán los dos una sola carne». Es este un gran misterio: y yo lo refiero a Cristo y a la Iglesia.'
    },
    psalm: {
      citation: 'Salmo 127, 1-2. 3. 4-5',
      response: 'Dichosos los que temen al Señor.',
      verses: [
        'Dichoso el que teme al Señor y sigue sus caminos. Comerás del fruto de tu trabajo, serás dichoso, te irá bien.',
        'Tu mujer, como parra fecunda, en medio de tu casa; tus hijos, como renuevos de olivo, alrededor de tu mesa.',
        'Esta es la bendición del hombre que teme al Señor. Que el Señor te bendiga desde Sión, que veas la prosperidad de Jerusalén todos los días de tu vida.'
      ]
    }
  },
  '30-3': {
    firstReading: {
      citation: 'Efesios 6, 1-9',
      text: 'Hijos, obedeced a vuestros padres en el Señor, porque eso es justo. «Honra a tu padre y a tu madre» es el primer mandamiento al que se añade una promesa: «Te irá bien y vivirás largo tiempo en la tierra». Padres, no exasperéis a vuestros hijos; criadlos educándolos y corrigiéndolos según el Señor. Esclavos, obedeced a vuestros amos de la tierra... como esclavos de Cristo que cumplen de corazón la voluntad de Dios... Y vosotros, amos, haced lo mismo con ellos, sabiendo que en el cielo está su Señor y el vuestro, y que en él no hay favoritismos.'
    },
    psalm: {
      citation: 'Salmo 144, 10-11. 12-13ab. 13cd-14',
      response: 'El Señor es fiel a sus palabras.',
      verses: [
        'Que todas tus criaturas te den gracias, Señor, que te bendigan tus fieles; que proclamen la gloria de tu reinado, que hablen de tus hazañas.',
        'Explicando tus hazañas a los hombres, la gloria y majestad de tu reinado. Tu reinado es un reinado perpetuo, tu gobierno va de edad en edad.',
        'El Señor es fiel a sus palabras, bondadoso en todas sus acciones. El Señor sostiene a los que van a caer, endereza a los que ya se doblan.'
      ]
    }
  },
  '30-4': {
    firstReading: {
      citation: 'Efesios 6, 10-20',
      text: 'Hermanos: Buscad vuestra fuerza en el Señor y en su invencible poder. Poneos las armas de Dios, para poder afrontar las asechanzas del diablo... Estad firmes; ceñid la cintura con la verdad, y revestid la coraza de la justicia; calzad los pies con la prontitud para el evangelio de la paz. Embrazad el escudo de la fe... Tomad el casco de la salvación y la espada del Espíritu, que es la palabra de Dios. Siempre en oración y súplica, orad en toda ocasión en el Espíritu... y también por mí, para que cuando abra mi boca se me conceda el don de la palabra, y anuncie con valentía el misterio del Evangelio.'
    },
    psalm: {
      citation: 'Salmo 143, 1. 2. 9-10',
      response: 'Bendito el Señor, mi Roca.',
      verses: [
        'Bendito el Señor, mi Roca, que adiestra mis manos para el combate, mis dedos para la pelea.',
        'Mi bienhechor, mi alcázar, baluarte donde me pongo a salvo, mi escudo y mi refugio, que me somete los pueblos.',
        'Dios mío, te cantaré un cántico nuevo, tocaré para ti el arpa de diez cuerdas: para ti que das la victoria a los reyes, y salvas a David, tu siervo.'
      ]
    }
  },
  '30-5': {
    firstReading: {
      citation: 'Filipenses 1, 1-11',
      text: 'Pablo y Timoteo, siervos de Cristo Jesús, a todos los santos en Cristo Jesús que residen en Filipos... Doy gracias a mi Dios cada vez que os menciono; siempre que rezo por todos vosotros, lo hago con gran alegría, porque habéis sido colaboradores míos en la obra del Evangelio, desde el primer día hasta hoy. Esta es nuestra confianza: que el que ha inaugurado entre vosotros esta buena obra la llevará adelante hasta el Día de Cristo Jesús... Y esta es mi oración: que vuestro amor siga creciendo más y más en penetración y en sensibilidad para apreciar los valores.'
    },
    psalm: {
      citation: 'Salmo 110, 1-2. 3-4. 5-6',
      response: 'Grandes son las obras del Señor.',
      verses: [
        'Doy gracias al Señor de todo corazón, en compañía de los rectos, en la asamblea. Grandes son las obras del Señor, dignas de estudio para los que las aman.',
        'Esplendor y belleza son su obra, su generosidad dura por siempre; ha hecho maravillas memorables, el Señor es piadoso y clemente.',
        'Él da alimento a sus fieles, recordando siempre su alianza; mostró a su pueblo la fuerza de su poder, dándoles la heredad de los gentiles.'
      ]
    }
  },
  '30-6': {
    firstReading: {
      citation: 'Filipenses 1, 18b-26',
      text: 'Hermanos: Con tal de que se anuncie a Cristo, por cualquier medio, sea con segundas intenciones o con sinceridad, yo me alegro y me seguiré alegrando... Cristo será glorificado en mi cuerpo, sea por mi vida o por mi muerte. Para mí la vida es Cristo, y una ganancia el morir. Pero si el vivir esta vida mortal me supone trabajo fructífero, no sé qué escoger. Me encuentro en esta alternativa: por un lado, deseo partir para estar con Cristo, que es con mucho lo mejor; pero, por otro, quedarme en esta vida veo que es más necesario para vosotros.'
    },
    psalm: {
      citation: 'Salmo 41, 2. 3; 42, 3. 4',
      response: 'Mi alma tiene sed del Dios vivo.',
      verses: [
        'Como busca la cierva corrientes de agua, así mi alma te busca a ti, Dios mío.',
        'Tiene sed de Dios, del Dios vivo: ¿cuándo entraré a ver el rostro de Dios?',
        'Envía tu luz y tu verdad: que ellas me guíen y me conduzcan hasta tu monte santo, hasta tu morada. Que yo me acerque al altar de Dios, al Dios de mi alegría.'
      ]
    }
  },

  // Semana 31 (Año II - Filipenses)
  '31-1': {
    firstReading: {
      citation: 'Filipenses 2, 1-4',
      text: 'Hermanos: Si queréis darme el consuelo de Cristo y aliviarme con vuestro amor, si nos une el mismo Espíritu y tenéis entrañas compasivas, dadme esta gran alegría: manteneos unánimes y concordes con un mismo amor y un mismo sentir. No obréis por rivalidad ni por ostentación, dejaos guiar por la humildad y considerad siempre superiores a los demás. No os encerréis en vuestros intereses, sino buscad todos el interés de los demás.'
    },
    psalm: {
      citation: 'Salmo 130, 1. 2. 3',
      response: 'Guarda mi alma en la paz junto a ti, Señor.',
      verses: [
        'Señor, mi corazón no es ambicioso, ni mis ojos altaneros; no pretendo grandezas que superan mi capacidad.',
        'Sino que acallo y modero mis deseos, como un niño en brazos de su madre.',
        'Espere Israel en el Señor ahora y por siempre.'
      ]
    }
  },
  '31-2': {
    firstReading: {
      citation: 'Filipenses 2, 5-11',
      text: 'Hermanos: Tened entre vosotros los sentimientos propios de Cristo Jesús. El cual, siendo de condición divina, no retuvo ávidamente el ser igual a Dios; al contrario, se despojó de sí mismo tomando la condición de esclavo, hecho semejante a los hombres. Y así, reconocido como hombre por su presencia, se humilló a sí mismo, hecho obediente hasta la muerte, y una muerte de cruz. Por eso Dios lo exaltó sobre todo y le concedió el Nombre-sobre-todo-nombre; de modo que al nombre de Jesús toda rodilla se doble en el cielo, en la tierra, en el abismo, y toda lengua proclame: Jesucristo es Señor, para gloria de Dios Padre.'
    },
    psalm: {
      citation: 'Salmo 21, 26b-27. 28-30a. 31-32',
      response: 'El Señor es mi alabanza en la gran asamblea.',
      verses: [
        'Cumpliré mis votos delante de sus fieles. Los desvalidos comerán hasta saciarse, alabarán al Señor los que lo buscan: ¡viva su corazón por siempre!',
        'Lo recordarán y volverán al Señor hasta de los confines del orbe; en su presencia se postrarán las familias de los pueblos. Porque del Señor es el reino, él gobierna a los pueblos.',
        'Mi descendencia lo servirá, hablarán del Señor a la generación futura, contarán su justicia al pueblo que ha de nacer: todo lo que hizo el Señor.'
      ]
    }
  },
  '31-3': {
    firstReading: {
      citation: 'Filipenses 2, 12-18',
      text: 'Queridos hermanos: Ya que siempre habéis obedecido, no solo cuando yo estaba presente, sino mucho más ahora en mi ausencia, trabajad por vuestra salvación con temor y temblor, porque es Dios quien activa en vosotros el querer y la actividad para realizar su designio de amor. Cualquier cosa que hagáis sea sin protestas ni discusiones, así seréis irreprochables y límpidos, hijos de Dios sin tacha, en medio de una generación perversa y depravada, entre la cual brilláis como lumbreras del mundo, manteniendo firme la palabra de la vida.'
    },
    psalm: {
      citation: 'Salmo 26, 1. 4. 13-14',
      response: 'El Señor es mi luz y mi salvación.',
      verses: [
        'El Señor es mi luz y mi salvación, ¿a quién temeré? El Señor es la defensa de mi vida, ¿quién me hará temblar?',
        'Una cosa pido al Señor, eso buscaré: habitar en la casa del Señor por los días de mi vida; gozar de la dulzura del Señor, contemplando su templo.',
        'Espero gozar de la dicha del Señor en el país de la vida. Espera en el Señor, sé valiente, ten ánimo, espera en el Señor.'
      ]
    }
  },
  '31-4': {
    firstReading: {
      citation: 'Filipenses 3, 3-8a',
      text: 'Hermanos: Los verdaderos circuncisos somos nosotros, que damos culto con el Espíritu de Dios, y que ponemos nuestra gloria en Cristo Jesús, sin confiar en la carne... Sin embargo, todo eso que para mí era ganancia, lo consideré pérdida a causa de Cristo. Más aún: todo lo considero pérdida comparado con la excelencia del conocimiento de Cristo Jesús, mi Señor.'
    },
    psalm: {
      citation: 'Salmo 104, 2-3. 4-5. 6-7',
      response: 'Que se alegren los que buscan al Señor.',
      verses: [
        'Cantadle al son de instrumentos, hablad de sus maravillas; gloriaos de su nombre santo, que se alegren los que buscan al Señor.',
        'Recurrid al Señor y a su poder, buscad continuamente su rostro. Recordad las maravillas que hizo, sus prodigios, las sentencias de su boca.',
        '¡Estirpe de Abrahán, su siervo; hijos de Jacob, su elegido! El Señor es nuestro Dios, él gobierna toda la tierra.'
      ]
    }
  },
  '31-5': {
    firstReading: {
      citation: 'Filipenses 3, 17 — 4, 1',
      text: 'Hermanos: Sed imitadores míos y fijaos en los que andan según el modelo que tenéis en nosotros. Porque —como os decía muchas veces y ahora os lo repito con lágrimas en los ojos— hay muchos que andan como enemigos de la cruz de Cristo... Nosotros, por el contrario, somos ciudadanos del cielo, de donde aguardamos un Salvador: el Señor Jesucristo. Él transformará nuestro cuerpo humilde, según el modelo de su cuerpo glorioso... Así, pues, hermanos míos queridos y añorados, mi alegría y mi corona, manteneos así, en el Señor, queridos.'
    },
    psalm: {
      citation: 'Salmo 121, 1-2. 3-4a. 4b-5',
      response: 'Vamos alegres a la casa del Señor.',
      verses: [
        '¡Qué alegría cuando me dijeron: «Vamos a la casa del Señor»! Ya están pisando nuestros pies tus umbrales, Jerusalén.',
        'Jerusalén está fundada como ciudad bien compacta. Allá suben las tribus, las tribus del Señor.',
        'Según la costumbre de Israel, a celebrar el nombre del Señor; en ella están los tribunales de justicia, en el palacio de David.'
      ]
    }
  },
  '31-6': {
    firstReading: {
      citation: 'Filipenses 4, 10-19',
      text: 'Hermanos: Me alegré mucho en el Señor porque habéis hecho florecer de nuevo vuestro interés por mí... Sé vivir en pobreza y abundancia. Estoy entrenado para todo y en todo: la hartura y el hambre, la abundancia y la privación. Todo lo puedo en aquel que me conforta. En todo caso, hicisteis bien en compartir mi tribulación... En pago, mi Dios proveerá a todas vuestras necesidades con magnificencia, conforme a su riqueza en Cristo Jesús.'
    },
    psalm: {
      citation: 'Salmo 111, 1-2. 5-6. 8a y 9',
      response: 'Dichoso quien teme al Señor.',
      verses: [
        'Dichoso quien teme al Señor y ama de corazón sus mandatos. Su linaje será poderoso en la tierra, la descendencia del justo será bendita.',
        'Dichoso el que se apiada y presta, y administra rectamente sus asuntos. El justo jamás vacilará, su recuerdo será perpetuo.',
        'Su corazón está seguro, sin temor. Reparte limosna a los pobres; su caridad es constante, sin falta, y alzará la frente con dignidad.'
      ]
    }
  },

  // Semana 32 (Año II - Tito, Filemón, 2 y 3 Juan)
  '32-1': {
    firstReading: {
      citation: 'Tito 1, 1-9',
      text: 'Pablo, siervo de Dios y apóstol de Jesucristo, para llevar a los elegidos de Dios a la fe y al conocimiento de la verdad... a Tito, verdadero hijo según la fe común: gracia y paz de parte de Dios Padre y de Cristo Jesús, nuestro Salvador. Te dejé en Creta para que pusieras en orden lo que faltaba y establecieras presbíteros en cada ciudad... Porque el obispo, como administrador de Dios, tiene que ser intachable... hospitalario, amigo del bien, sensato, justo, piadoso, dueño de sí; que se mantenga firme en la palabra fiel, según la enseñanza, para que sea capaz de exhortar con la sana doctrina.'
    },
    psalm: {
      citation: 'Salmo 23, 1-2. 3-4ab. 5-6',
      response: 'Este es el grupo que viene a tu presencia, Señor.',
      verses: [
        'Del Señor es la tierra y cuanto la llena, el orbe y todos sus habitantes: él la fundó sobre los mares, él la afianzó sobre los ríos.',
        '¿Quién puede subir al monte del Señor? ¿Quién puede estar en el recinto sacro? El hombre de manos inocentes y puro corazón, que no confía en los ídolos.',
        'Ese recibirá la bendición del Señor, le hará justicia el Dios de salvación. Este es el grupo que busca al Señor, que viene a tu presencia, Dios de Jacob.'
      ]
    }
  },
  '32-2': {
    firstReading: {
      citation: 'Tito 2, 1-8. 11-14',
      text: 'Querido hermano: Habla de lo que es conforme a la sana doctrina... Preséntate tú mismo como modelo de buena conducta en la enseñanza, en la integridad, en la seriedad, con un hablar sano e intachable... Porque se ha manifestado la gracia de Dios, que trae la salvación para todos los hombres, enseñándonos a que, renunciando a la impiedad y a los deseos mundanos, llevemos ya desde ahora una vida sobria, justa y piadosa, aguardando la dicha que esperamos y la manifestación de la gloria del gran Dios y Salvador nuestro, Jesucristo.'
    },
    psalm: {
      citation: 'Salmo 36, 3-4. 18 y 23. 27 y 29',
      response: 'El Señor es quien salva a los justos.',
      verses: [
        'Confía en el Señor y haz el bien, habita tu tierra y practica la lealtad; sea el Señor tu delicia, y él te dará lo que pide tu corazón.',
        'El Señor vela por los días de los buenos, y su herencia durará siempre. El Señor asegura los pasos del hombre, se complace en sus caminos.',
        'Apártate del mal y haz el bien, y siempre tendrás una casa; los justos poseen la tierra, la habitarán por siempre jamás.'
      ]
    }
  },
  '32-3': {
    firstReading: {
      citation: 'Tito 3, 1-7',
      text: 'Querido hermano: Recuérdales que se sometan a los gobernantes y autoridades, que los obedezcan, que estén dispuestos a toda clase de obras buenas... Pero cuando ha aparecido la bondad de Dios, nuestro Salvador, y su amor al hombre, no por las obras de justicia que hayamos hecho nosotros, sino, según su propia misericordia, nos ha salvado por el baño del nuevo nacimiento y de la renovación del Espíritu Santo, que derramó copiosamente sobre nosotros por medio de Jesucristo, nuestro Salvador, para que, justificados por su gracia, seamos, en esperanza, herederos de la vida eterna.'
    },
    psalm: {
      citation: 'Salmo 22, 1-3a. 3b-4. 5. 6',
      response: 'El Señor es mi pastor, nada me falta.',
      verses: [
        'El Señor es mi pastor, nada me falta: en verdes praderas me hace recostar; me conduce hacia fuentes tranquilas y repara mis fuerzas.',
        'Me guía por el sendero justo, por el honor de su nombre. Aunque camine por cañadas oscuras, nada temo, porque tú vas conmigo: tu vara y tu cayado me sosiegan.',
        'Preparas una mesa ante mí, enfrente de mis enemigos; me unges la cabeza con perfume, y mi copa rebosa. Tu bondad y tu misericordia me acompañan todos los días de mi vida.'
      ]
    }
  },
  '32-4': {
    firstReading: {
      citation: 'Filemón 7-20',
      text: 'Querido hermano: Tu amor me ha proporcionado gran alegría y consuelo, porque, gracias a ti, los corazones de los santos han encontrado alivio. Por eso, aunque tengo plena libertad en Cristo para mandarte lo que conviene, prefiero rogártelo apelando a tu caridad, yo, Pablo, anciano y ahora prisionero por Cristo Jesús. Te ruego por mi hijo, a quien engendré en la prisión, por Onésimo... Te lo envío como a mi propio corazón... Quizá se apartó de ti por breve tiempo para que lo recobres ahora para siempre; y no como esclavo, sino como algo mejor que un esclavo, como un hermano querido.'
    },
    psalm: {
      citation: 'Salmo 145, 7. 8-9a. 9bc-10',
      response: 'Dichoso aquel a quien auxilia el Dios de Jacob.',
      verses: [
        'El Señor mantiene su fidelidad perpetuamente, hace justicia a los oprimidos, da pan a los hambrientos. El Señor liberta a los cautivos.',
        'El Señor abre los ojos al ciego, el Señor endereza a los que ya se doblan, el Señor ama a los justos, el Señor guarda a los peregrinos.',
        'Sustenta al huérfano y a la viuda y trastorna el camino de los malvados. El Señor reina eternamente, tu Dios, Sión, de edad en edad.'
      ]
    }
  },
  '32-5': {
    firstReading: {
      citation: '2 Juan 4-9',
      text: 'Señora elegida: Me alegré mucho al enterarme de que tus hijos caminan en la verdad, según el mandamiento que el Padre nos dio. Ahora tengo algo que pedirte, señora... que nos amemos unos a otros. Y en esto consiste el amor: en que caminemos según sus mandamientos... Es que han salido en el mundo muchos embusteros, que no reconocen que Jesucristo vino en la carne... Todo el que se propasa y no permanece en la doctrina de Cristo no posee a Dios; quien permanece en la doctrina posee al Padre y al Hijo.'
    },
    psalm: {
      citation: 'Salmo 118, 1. 2. 10. 11. 17. 18',
      response: 'Dichoso el que camina en la voluntad del Señor.',
      verses: [
        'Dichoso el que, con vida intachable, camina en la voluntad del Señor; dichoso el que, guardando sus preceptos, lo busca de todo corazón.',
        'Te busco de todo corazón, no consientas que me desvíe de tus mandamientos. En mi corazón escondo tus consignas, así no pecaré contra ti.',
        'Haz bien a tu siervo: viviré y cumpliré tus palabras; ábreme los ojos, y contemplaré las maravillas de tu voluntad.'
      ]
    }
  },
  '32-6': {
    firstReading: {
      citation: '3 Juan 5-8',
      text: 'Querido Gayo: Te portas con plena fidelidad en todo lo que haces por los hermanos, y eso que para ti son extraños. Ellos han hablado de tu caridad ante la Iglesia. Harás bien en proveerlos para el viaje como Dios se merece; ellos se pusieron en camino por el Nombre, sin aceptar nada de los paganos. Por eso debemos nosotros sostener a hombres como estos, para ser colaboradores de la verdad.'
    },
    psalm: {
      citation: 'Salmo 111, 1-2. 3-4. 5-6',
      response: 'Dichoso quien teme al Señor.',
      verses: [
        'Dichoso quien teme al Señor y ama de corazón sus mandatos. Su linaje será poderoso en la tierra, la descendencia del justo será bendita.',
        'En su casa habrá riquezas y abundancia, su caridad es constante, sin falta. En las tinieblas brilla como una luz el que es justo, clemente y compasivo.',
        'Dichoso el que se apiada y presta, y administra rectamente sus asuntos. El justo jamás vacilará, su recuerdo será perpetuo.'
      ]
    }
  },

  // Semana 33 (Año II - Apocalipsis)
  '33-1': {
    firstReading: {
      citation: 'Apocalipsis 1, 1-4; 2, 1-5a',
      text: 'Revelación de Jesucristo, que Dios le encargó mostrar a sus siervos acerca de lo que tiene que suceder pronto... Dichoso el que lee y dichosos los que escuchan las palabras de esta profecía y guardan lo que en ella está escrito, porque el tiempo está cerca... Oí al Señor que me decía: «Al ángel de la Iglesia de Éfeso escríbele: Conozco tus obras, tu fatiga, tu perseverancia... Pero tengo contra ti que has abandonado tu amor primero. Acuérdate, pues, de dónde has caído, conviértete y haz las obras primeras».'
    },
    psalm: {
      citation: 'Salmo 1, 1-2. 3. 4 y 6',
      response: 'Al que salga vencedor le daré a comer del árbol de la vida.',
      verses: [
        'Dichoso el hombre que no sigue el consejo de los impíos, ni entra por la senda de los pecadores, ni se sienta en la reunión de los cínicos; sino que su gozo es la ley del Señor, y medita su ley día y noche.',
        'Será como un árbol plantado al borde de la acequia: da fruto en su sazón y no se marchitan sus hojas; y cuanto emprende tiene buen fin.',
        'No así los impíos, no así; serán paja que arrebata el viento. Porque el Señor protege el camino de los justos, pero el camino de los impíos acaba mal.'
      ]
    }
  },
  '33-2': {
    firstReading: {
      citation: 'Apocalipsis 3, 1-6. 14-22',
      text: 'Yo, Juan, oí al Señor que me decía: «Al ángel de la Iglesia de Sardes escríbele: Conozco tus obras; tienes nombre como de quien vive, pero estás muerto. Sé vigilante y reanima lo que te queda... Al ángel de la Iglesia de Laodicea escríbele: Conozco tus obras: no eres ni frío ni caliente. ¡Ojalá fueras frío o caliente! Pero porque eres tibio, estoy a punto de vomitarte de mi boca... Mira que estoy a la puerta y llamo; si alguien oye mi voz y me abre la puerta, entraré en su casa y cenaré con él y él conmigo. Al vencedor le concederé sentarse conmigo en mi trono».'
    },
    psalm: {
      citation: 'Salmo 14, 2-3a. 3bc-4ab. 5',
      response: 'Al vencedor lo sentaré en mi trono, junto a mí.',
      verses: [
        'El que procede honradamente y practica la justicia, el que tiene intenciones leales y no calumnia con su lengua.',
        'El que no hace mal a su prójimo ni difama al vecino, el que considera despreciable al impío y honra a los que temen al Señor.',
        'El que no presta dinero a usura ni acepta soborno contra el inocente. El que así obra nunca fallará.'
      ]
    }
  },
  '33-3': {
    firstReading: {
      citation: 'Apocalipsis 4, 1-11',
      text: 'Yo, Juan, miré y vi una puerta abierta en el cielo... Había un trono en el cielo, y uno sentado en el trono... Alrededor del trono había veinticuatro tronos, y sentados en ellos veinticuatro ancianos con vestiduras blancas y coronas de oro en la cabeza... Y los cuatro vivientes no cesan de exclamar día y noche: «Santo, santo, santo es el Señor Dios, el todopoderoso; el que era y es y viene». Y los veinticuatro ancianos se postran ante el que está sentado en el trono, diciendo: «Eres digno, Señor, Dios nuestro, de recibir la gloria, el honor y el poder, porque tú has creado el universo».'
    },
    psalm: {
      citation: 'Salmo 150, 1-2. 3-4. 5-6',
      response: 'Santo, santo, santo es el Señor, soberano de todo.',
      verses: [
        'Alabad al Señor en su templo, alabadlo en su augusto firmamento. Alabadlo por sus obras magníficas, alabadlo por su inmensa grandeza.',
        'Alabadlo tocando trompetas, alabadlo con arpas y cítaras, alabadlo con tambores y danzas, alabadlo con trompas y flautas.',
        'Alabadlo con platillos sonoros, alabadlo con platillos vibrantes. Todo ser que alienta alabe al Señor.'
      ]
    }
  },
  '33-4': {
    firstReading: {
      citation: 'Apocalipsis 5, 1-10',
      text: 'Yo, Juan, vi en la mano derecha del que está sentado en el trono un libro escrito por dentro y por fuera, y sellado con siete sellos... Uno de los ancianos me dijo: «Deja de llorar; pues ha vencido el león de la tribu de Judá, el retoño de David, y es capaz de abrir el libro y sus siete sellos». Y vi en medio del trono... un Cordero de pie, como degollado... Y cantan un cántico nuevo: «Eres digno de tomar el libro y abrir sus sellos, porque fuiste degollado, y con tu sangre compraste para Dios hombres de toda tribu, lengua, pueblo y nación; y has hecho de ellos para nuestro Dios un reino de sacerdotes, y reinan sobre la tierra».'
    },
    psalm: {
      citation: 'Salmo 149, 1-2. 3-4. 5-6a y 9b',
      response: 'Has hecho de nosotros para nuestro Dios un reino de sacerdotes.',
      verses: [
        'Cantad al Señor un cántico nuevo, resuene su alabanza en la asamblea de los fieles; que se alegre Israel por su Creador, los hijos de Sión por su Rey.',
        'Alabad su nombre con danzas, cantadle con tambores y cítaras; porque el Señor ama a su pueblo y adorna con la victoria a los humildes.',
        'Que los fieles festejen su gloria y canten jubilosos en filas, con vítores a Dios en la boca. Es un honor para todos sus fieles.'
      ]
    }
  },
  '33-5': {
    firstReading: {
      citation: 'Apocalipsis 10, 8-11',
      text: 'Yo, Juan, oí la voz del cielo que me hablaba de nuevo, diciendo: «Ve a tomar el librito abierto de la mano del ángel que está de pie sobre el mar y sobre la tierra». Me acerqué al ángel y le pedí que me diera el librito. Él me dice: «Toma y devóralo; te amargará en el vientre, pero en tu boca será dulce como la miel». Tomé el librito de mano del ángel y lo devoré; en mi boca sabía dulce como la miel, pero, cuando lo comí, mi vientre se llenó de amargor. Y me dicen: «Es preciso que profetices de nuevo sobre muchos pueblos, naciones, lenguas y reyes».'
    },
    psalm: {
      citation: 'Salmo 118, 14. 24. 72. 103. 111. 131',
      response: '¡Qué dulce al paladar tu promesa, Señor!',
      verses: [
        'Mi alegría es el camino de tus preceptos, más que todas las riquezas. Tus preceptos son mi delicia, tus decretos son mis consejeros.',
        'Más estimo yo los preceptos de tu boca que miles de monedas de oro y plata. ¡Qué dulce al paladar tu promesa: más que miel en la boca!',
        'Tus preceptos son mi herencia perpetua, la alegría de mi corazón. Abro la boca y respiro, ansiando tus mandamientos.'
      ]
    }
  },
  '33-6': {
    firstReading: {
      citation: 'Apocalipsis 11, 4-12',
      text: 'Me fue dicho a mí, Juan: «Estos son mis dos testigos, los dos olivos y los dos candelabros que están en pie ante el Señor de la tierra»... Y cuando terminen su testimonio, la bestia que sube del abismo les hará la guerra, los vencerá y los matará... Pero, al cabo de tres días y medio, un aliento de vida que venía de Dios entró en ellos, y se pusieron de pie... Y oyeron una gran voz del cielo que les decía: «Subid aquí». Y subieron al cielo en la nube, a la vista de sus enemigos.'
    },
    psalm: {
      citation: 'Salmo 143, 1. 2. 9-10',
      response: 'Bendito el Señor, mi Roca.',
      verses: [
        'Bendito el Señor, mi Roca, que adiestra mis manos para el combate, mis dedos para la pelea.',
        'Mi bienhechor, mi alcázar, baluarte donde me pongo a salvo, mi escudo y mi refugio, que me somete los pueblos.',
        'Dios mío, te cantaré un cántico nuevo, tocaré para ti el arpa de diez cuerdas: para ti que das la victoria a los reyes, y salvas a David, tu siervo.'
      ]
    }
  },

  // Semana 34 (Año II - Apocalipsis)
  '34-1': {
    firstReading: {
      citation: 'Apocalipsis 14, 1-3. 4b-5',
      text: 'Yo, Juan, miré, y he aquí que el Cordero estaba de pie sobre el monte Sión, y con él ciento cuarenta y cuatro mil, que llevaban escrito en la frente su nombre y el nombre de su Padre... Y cantaban un cántico nuevo delante del trono... Estos siguen al Cordero adondequiera que vaya. Han sido rescatados de entre los hombres como primicias para Dios y para el Cordero. En su boca no se encontró mentira: son intachables.'
    },
    psalm: {
      citation: 'Salmo 23, 1-2. 3-4ab. 5-6',
      response: 'Este es el grupo que viene a tu presencia, Señor.',
      verses: [
        'Del Señor es la tierra y cuanto la llena, el orbe y todos sus habitantes: él la fundó sobre los mares, él la afianzó sobre los ríos.',
        '¿Quién puede subir al monte del Señor? ¿Quién puede estar en el recinto sacro? El hombre de manos inocentes y puro corazón, que no confía en los ídolos.',
        'Ese recibirá la bendición del Señor, le hará justicia el Dios de salvación. Este es el grupo que busca al Señor, que viene a tu presencia, Dios de Jacob.'
      ]
    }
  },
  '34-2': {
    firstReading: {
      citation: 'Apocalipsis 14, 14-19',
      text: 'Yo, Juan, miré, y había una nube blanca, y sentado sobre la nube uno semejante a un Hijo de hombre, con una corona de oro en la cabeza y una hoz afilada en la mano. Y otro ángel salió del santuario gritando con voz potente al que estaba sentado sobre la nube: «Mete tu hoz y siega, que ha llegado la hora de la siega, pues ya está madura la mies de la tierra». Y el que estaba sentado sobre la nube metió su hoz sobre la tierra, y la tierra quedó segada.'
    },
    psalm: {
      citation: 'Salmo 95, 10. 11-12. 13',
      response: 'Llega el Señor a regir la tierra.',
      verses: [
        'Decid a los pueblos: «El Señor es rey: él afianzó el orbe, y no se moverá; él gobierna a los pueblos rectamente».',
        'Alégrese el cielo, goce la tierra, retumbe el mar y cuanto lo llena; vitoreen los campos y cuanto hay en ellos, aclamen los árboles del bosque.',
        'Delante del Señor, que ya llega, ya llega a regir la tierra: regirá el orbe con justicia y los pueblos con fidelidad.'
      ]
    }
  },
  '34-3': {
    firstReading: {
      citation: 'Apocalipsis 15, 1-4',
      text: 'Yo, Juan, vi en el cielo otra señal, grande y maravillosa: siete ángeles que llevaban siete plagas, las últimas, pues con ellas se consuma la ira de Dios. Y vi como un mar de vidrio mezclado con fuego; y los que habían vencido a la bestia... estaban de pie sobre el mar de vidrio, con las cítaras de Dios. Y cantan el cántico de Moisés, siervo de Dios, y el cántico del Cordero, diciendo: «Grandes y admirables son tus obras, Señor, Dios todopoderoso; justos y verdaderos tus caminos, Rey de las naciones... porque todas las naciones vendrán y se postrarán en tu acatamiento».'
    },
    psalm: {
      citation: 'Salmo 97, 1. 2-3ab. 7-8. 9',
      response: 'Grandes y maravillosas son tus obras, Señor, Dios omnipotente.',
      verses: [
        'Cantad al Señor un cántico nuevo, porque ha hecho maravillas: su diestra le ha dado la victoria, su santo brazo.',
        'El Señor da a conocer su victoria, revela a las naciones su justicia: se acordó de su misericordia y su fidelidad en favor de la casa de Israel.',
        'Retumbe el mar y cuanto contiene, la tierra y cuantos la habitan; aplaudan los ríos, aclamen los montes al Señor, que llega para regir la tierra con justicia y los pueblos con rectitud.'
      ]
    }
  },
  '34-4': {
    firstReading: {
      citation: 'Apocalipsis 18, 1-2. 21-23; 19, 1-3. 9a',
      text: 'Yo, Juan, vi bajar del cielo a otro ángel con gran autoridad, y la tierra quedó iluminada por su resplandor. Y gritó con voz potente: «¡Cayó, cayó la gran Babilonia!»... Después de esto oí en el cielo como el vocerío de una gran muchedumbre, que decía: «¡Aleluya! La salvación, la gloria y el poder son de nuestro Dios, porque sus juicios son verdaderos y justos»... Y me dijo: «Escribe: Bienaventurados los invitados al banquete de bodas del Cordero».'
    },
    psalm: {
      citation: 'Salmo 99, 2. 3. 4. 5',
      response: 'Dichosos los invitados a la cena de las bodas del Cordero.',
      verses: [
        'Aclama al Señor, tierra entera, servid al Señor con alegría, entrad en su presencia con vítores.',
        'Sabed que el Señor es Dios: que él nos hizo y somos suyos, su pueblo y ovejas de su rebaño. Entrad por sus puertas con acción de gracias, por sus atrios con himnos.',
        'Dándole gracias y bendiciendo su nombre: «El Señor es bueno, su misericordia es eterna, su fidelidad por todas las edades».'
      ]
    }
  },
  '34-5': {
    firstReading: {
      citation: 'Apocalipsis 20, 1-4. 11 — 21, 2',
      text: 'Yo, Juan, vi un ángel que bajaba del cielo con la llave del abismo y una cadena grande en la mano. Sujetó al dragón, la serpiente antigua... Vi un trono blanco y grande, y al que estaba sentado sobre él... Y los muertos fueron juzgados según sus obras... Y vi un cielo nuevo y una tierra nueva, pues el primer cielo y la primera tierra desaparecieron, y el mar ya no existe. Y vi la ciudad santa, la nueva Jerusalén, que descendía del cielo, de parte de Dios, preparada como una esposa que se ha adornado para su esposo.'
    },
    psalm: {
      citation: 'Salmo 83, 3. 4. 5-6a y 8a',
      response: 'Esta es la morada de Dios con los hombres.',
      verses: [
        'Mi alma se consume y anhela los atrios del Señor, mi corazón y mi carne retozan por el Dios vivo.',
        'Hasta el gorrión ha encontrado una casa; la golondrina, un nido donde colocar sus polluelos: tus altares, Señor del universo, Rey mío y Dios mío.',
        'Dichosos los que viven en tu casa, alabándote siempre. Dichosos los que encuentran en ti su fuerza; caminan de altura en altura.'
      ]
    }
  },
  '34-6': {
    firstReading: {
      citation: 'Apocalipsis 22, 1-7',
      text: 'El ángel del Señor me mostró a mí, Juan, el río de agua de vida, reluciente como el cristal, que brotaba del trono de Dios y del Cordero. En medio de su plaza, a un lado y otro del río, hay un árbol de vida que da doce cosechas... Y ya no habrá maldición alguna. Y el trono de Dios y del Cordero estará en ella, y sus siervos le darán culto, y verán su rostro... Y el Señor Dios alumbrará sobre ellos, y reinarán por los siglos de los siglos... «Mira, vengo pronto. Bienaventurado el que guarda las palabras proféticas de este libro».'
    },
    psalm: {
      citation: 'Salmo 94, 1-2. 3-5. 6-7',
      response: '¡Ven, Señor Jesús!',
      verses: [
        'Venid, aclamemos al Señor, demos vítores a la Roca que nos salva; entremos a su presencia dándole gracias, aclamándolo con cantos.',
        'Porque el Señor es un Dios grande, soberano de todos los dioses: tiene en su mano las simas de la tierra, son suyas las cumbres de los montes; suyo es el mar, porque él lo hizo, la tierra firme que modelaron sus manos.',
        'Entrad, postrémonos por tierra, bendiciendo al Señor, creador nuestro. Porque él es nuestro Dios, y nosotros su pueblo, el rebaño que él guía.'
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

const PENDING_NOTICE =
  'Las lecturas oficiales de este día aún no han sido publicadas. El leccionario se publica con unos tres meses de anticipación; vuelve a consultar más cerca de la fecha.';

/**
 * Local, offline liturgical day. Computes season, week, cycle and color for any date and only
 * includes local readings when they are known to be valid for that date (Ordinary Time Year II
 * weekdays and Cycle A Sundays bundled in this file). Otherwise the readings are marked as pending
 * so the app never shows readings from the wrong day.
 */
export function buildCanonicalDay(dateStr: string): LiturgicalDay {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = parseInt(parts[1], 10) || 1;
  const dayNum = parseInt(parts[2], 10) || 1;
  const normalizedDate = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

  const dateObj = new Date(year, month - 1, dayNum, 12, 0, 0);
  const dayOfWeekIndex = dateObj.getDay();
  const dayOfWeek = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
  const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });

  const info = getLiturgicalCalendarInfo(normalizedDate);
  const saintData = getSaintForDate(month, dayNum);
  const saint = {
    name: saintData.name,
    title: saintData.title,
    shortBio: saintData.shortBio,
    fullBio: saintData.fullBio,
    patronage: saintData.patronage,
    prayer: saintData.prayer,
  };

  const baseTitle = buildSeasonalTitle(normalizedDate, info);
  const { color, isFeast } = resolveLiturgicalColor(info, baseTitle, saintData.color);
  const colorLabel = color !== info.color && info.season === 'Tiempo Ordinario' ? `Memoria de ${saintData.name}` : info.season;
  const common = {
    date: dateStr,
    formattedDate: `${dayOfWeek}, ${monthName} ${dayNum}`,
    season: isFeast ? ('Fiesta / Solemnidad' as const) : info.season,
    color,
    colorName: getColorName(color, colorLabel),
    saint,
  };

  const isOrdinaryTime = info.season === 'Tiempo Ordinario';

  if (isOrdinaryTime && info.isSunday && info.sundayCycle === 'A') {
    const sundayData = SUNDAYS_CYCLE_A[info.week];
    if (sundayData) {
      return {
        ...common,
        title: baseTitle,
        firstReading: sundayData.firstReading,
        psalm: sundayData.psalm,
        secondReading: sundayData.secondReading,
        gospel: sundayData.gospel,
        source: 'local',
      };
    }
  }

  if (isOrdinaryTime && !info.isSunday) {
    const lookupKey = `${info.week}-${dayOfWeekIndex}`;
    // Weekday gospels (Luke, weeks 22-34) are shared by both years; first readings bundled here are Year II only.
    const gospelData = ORDINARY_TIME_LUKE_GOSPELS[lookupKey];
    const firstReadingData = info.weekdayYear === 'II' ? ORDINARY_TIME_YEAR_2_FIRST_READINGS[lookupKey] : undefined;
    if (gospelData && firstReadingData) {
      return {
        ...common,
        title: `${baseTitle} • ${saintData.name}`,
        firstReading: firstReadingData.firstReading,
        psalm: firstReadingData.psalm,
        gospel: gospelData,
        source: 'local',
      };
    }
  }

  return {
    ...common,
    title: info.isSunday ? baseTitle : `${baseTitle} • ${saintData.name}`,
    firstReading: { citation: 'Primera lectura por publicar', text: PENDING_NOTICE },
    psalm: { citation: 'Salmo responsorial por publicar', response: 'Lecturas aún no disponibles', verses: [PENDING_NOTICE] },
    gospel: {
      citation: 'Evangelio por publicar',
      acclamation: info.season === 'Cuaresma' ? 'Honor y gloria a ti, Señor Jesús.' : 'Aleluya, aleluya.',
      text: PENDING_NOTICE,
    },
    source: 'local',
    readingsPending: true,
  };
}
