import { buildCanonicalDay } from './canonicalLectionary.js';
import { fetchEvangelizoDay } from './evangelizo.js';
import { confirmedPrintSaint, hasFreshSaintVerification, pendingSaint, type SaintVerification } from './colombianSaints.js';
import { getColorName, getLiturgicalCalendarInfo, resolveLiturgicalColor } from './liturgicalCalendar.js';

export interface LiturgicalDay {
  date: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "viernes, septiembre 11"
  title: string; // e.g. "Viernes de la XXIII semana del Tiempo Ordinario"
  season: 'Tiempo Ordinario' | 'Cuaresma' | 'Pascua' | 'Adviento' | 'Navidad' | 'Fiesta / Solemnidad';
  color: 'green' | 'purple' | 'white' | 'red';
  colorName: string;
  saint: {
    name: string;
    title: string; // e.g. "Obispo y confesor"
    shortBio: string;
    fullBio: string;
    patronage?: string;
    prayer: string;
  };
  saintVerification?: SaintVerification;
  firstReading: {
    citation: string;
    text: string;
  };
  psalm: {
    citation: string;
    response: string;
    verses: string[];
  };
  secondReading?: {
    citation: string;
    text: string;
  };
  gospel: {
    citation: string;
    acclamation: string;
    text: string;
  };
  defaultReflection?: string;
  /** Origin of the readings: official Evangelizo lectionary, curated local entry or local fallback. */
  source?: 'evangelizo' | 'curated' | 'local';
  /** True when complete official readings could not be loaded or are not yet published. */
  readingsPending?: boolean;
  alternativeCelebration?: {
    title: string;
    season: 'Tiempo Ordinario' | 'Cuaresma' | 'Pascua' | 'Adviento' | 'Navidad' | 'Fiesta / Solemnidad';
    color: 'green' | 'purple' | 'white' | 'red';
    colorName: string;
    firstReading: { citation: string; text: string };
    psalm: { citation: string; response: string; verses: string[] };
    secondReading?: { citation: string; text: string };
    gospel: { citation: string; acclamation: string; text: string };
  };
}

export const LITURGY_DATABASE: Record<string, LiturgicalDay> = {
  '2026-09-10': {
    date: '2026-09-10',
    formattedDate: 'jueves, septiembre 10',
    title: 'Jueves de la XXIII semana del Tiempo Ordinario',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario',
    saint: {
      name: 'San Nicolás de Tolentino',
      title: 'Presbítero agustino',
      shortBio: 'San Nicolás (1245-1305) fue un sacerdote y fraile agustino italiano, conocido por su predicación fervorosa, su caridad hacia los pobres y su tierna devoción por las almas del purgatorio.',
      fullBio: 'Nacido en Sant\'Angelo in Pontano, entró a la orden de San Agustín inspirado por un sermón sobre la vanidad del mundo. Fue ordenado sacerdote a los 25 años y pasó sus últimos treinta años en Tolentino. Pasaba horas interminables en el confesionario, visitaba a los enfermos y distribuía alimentos bendecidos a los menesterosos. Es invocado como protector de las benditas almas del Purgatorio y patrono de la maternidad y la salud.',
      patronage: 'Almas del Purgatorio, enfermos, Italia',
      prayer: 'Señor Dios, que hiciste de San Nicolás de Tolentino un modelo insigne de caridad apostólica y oración por los difuntos, concédenos por su intercesión ser compasivos con los que sufren y fervientes en el amor a tu altar. Amén.'
    },
    firstReading: {
      citation: '1 Corintios 8:1b-7, 11-13',
      text: 'Hermanos: El conocimiento engríe, mientras que el amor edifica. Si alguno cree que conoce algo, todavía no lo conoce como se debe conocer. Pero si uno ama a Dios, ese es conocido por Él. Respecto a comer carne sacrificada a los ídolos, sabemos que un ídolo no es nada en el mundo y que no hay más que un solo Dios. Pues aun cuando se les llame dioses, sea en el cielo o en la tierra, para nosotros no hay más que un solo Dios, el Padre, de quien proceden todas las cosas y para quien somos nosotros; y un solo Señor, Jesucristo, por quien son todas las cosas y nosotros por medio de Él. Cuidad que esa libertad vuestra no sea tropiezo para los débiles.'
    },
    psalm: {
      citation: 'Salmo 139:1b-3, 13-14ab, 23-24',
      response: 'Guíame, Señor, por el camino eterno.',
      verses: [
        'Señor, tú me sondeas y me conoces; me conoces cuando me siento o me levanto, de lejos penetras mis pensamientos; distingues mi camino y mi descanso, todas mis sendas te son familiares.',
        'Tú has creado mis entrañas, me has tejido en el vientre de mi madre. Te doy gracias, porque me has formado de modo tan admirable; admirables son tus obras.',
        'Sondéame, oh Dios, y conoce mi corazón, ponme a prueba y conoce mis desvelos; mira si mi camino se desvía, guíame por el camino eterno.'
      ]
    },
    gospel: {
      citation: 'Lucas 6:27-38',
      acclamation: 'Aleluya, aleluya. Si nos amamos unos a otros, Dios permanece en nosotros y su amor ha llegado a la perfección en nosotros. Aleluya.',
      text: 'En aquel tiempo, dijo Jesús a sus discípulos: «A vosotros los que me escucháis os digo: amad a vuestros enemigos, haced el bien a los que os odian, bendecid a los que os maldicen, orad por los que os calumnian. Al que te pegue en una mejilla, preséntale también la otra; y al que te quite la capa, no le impidas que se lleve también la túnica. A quien te pida, dale, y al que se lleve lo tuyo, no se lo reclames. Tratad a los demás como queréis que os traten a vosotros... Sed misericordiosos como vuestro Padre es misericordioso; no juzguéis y no seréis juzgados; no condenéis y no seréis condenados; perdonad y seréis perdonados; dad y se os dará: una medida buena, apretada, remecida y rebosante pondrán en vuestro regazo. Porque con la medida con que midiereis se os medirá a vosotros».'
    }
  },

  '2026-09-11': {
    date: '2026-09-11',
    formattedDate: 'viernes, septiembre 11',
    title: 'Viernes de la XXIII semana del Tiempo Ordinario',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario',
    saint: {
      name: 'San Pafnucio de Tebas',
      title: 'Obispo y confesor',
      shortBio: 'San Pafnucio fue un obispo del siglo IV en la Tebaida Superior, Egipto, y discípulo de San Antonio Abad. Sufrió la persecución por su fe cristiana, perdiendo un ojo y siendo mutilado. Es célebre por su sabiduría en el Concilio de Nicea.',
      fullBio: 'San Pafnucio se formó en el silencio austero del desierto junto a San Antonio Magno. Nombrado obispo en la Tebaida, fue martirizado bajo la persecución del emperador Maximino: le arrancaron el ojo derecho y le cortaron los tendones de la pierna izquierda antes de enviarlo a trabajos forzados. Durante el gran Concilio Ecuménico de Nicea (325), el emperador Constantino el Grande sentía tanta veneración por sus llagas que en público besaba la cuenca vacía de su ojo. Se opuso con éxito al arrianismo y defendió con ardiente celo la fe en la divinidad de Jesucristo.',
      patronage: 'Egipto, confesores de la fe, personas con discapacidad visual',
      prayer: 'Dios misericordioso, que diste a San Pafnucio un espíritu inquebrantable de testimonio y amor a la verdad, haz que jamás nos avergoncemos de la Cruz de Cristo, sino que la llevemos como el más dulce honor de nuestras vidas. Por Jesucristo nuestro Señor. Amén.'
    },
    firstReading: {
      citation: '1 Corintios 9:16-19, 22b-27',
      text: 'Hermanos: El hecho de predicar no es para mí motivo de orgullo. No tengo más remedio y, ¡ay de mí si no anuncio el Evangelio! Si yo lo hiciera por mi propia voluntad, tendría derecho a recompensa; pero si lo hago por obligación, no hago más que cumplir un encargo. ¿Cuál es, pues, mi recompensa? Predicar el Evangelio gratuitamente, sin hacer valer los derechos que el Evangelio me da. Porque, siendo libre de todos, me he hecho esclavo de todos para ganar a los más posibles. Me he hecho todo para todos, para salvar de cualquier manera a algunos. Y todo esto lo hago por el Evangelio, para tener parte en él. ¿No sabéis que en las carreras del estadio todos corren, mas uno solo recibe el premio? Corred de tal modo que lo obtengáis. Los atletas se privan de todo; ellos para ganar una corona corruptible, nosotros una incorruptible. Así pues, yo corro, no sin rumbo; peleo, no como quien da golpes al aire, sino que golpeo mi cuerpo y lo someto, no sea que, habiendo predicado a otros, quede yo descalificado.'
    },
    psalm: {
      citation: 'Salmo 84:3, 4, 5-6, 12',
      response: '¡Qué deseables son tus moradas, Señor de los ejércitos!',
      verses: [
        'Mi alma se consume y anhela los atrios del Señor, mi corazón y mi carne se alegran por el Dios vivo.',
        'Hasta el gorrión ha encontrado una casa, y la golondrina un nido donde colocar sus polluelos: tus altares, Señor del universo, Rey mío y Dios mío.',
        'Dichosos los que viven en tu casa: alabándote siempre. Dichosos los que encuentran en ti su fuerza al preparar su peregrinación.',
        'Porque es mejor un día en tus atrios que mil fuera; prefiero el umbral de la casa de mi Dios a morar en las tiendas del malvado.'
      ]
    },
    gospel: {
      citation: 'Lucas 6:39-42',
      acclamation: 'Aleluya, aleluya. Tu palabra, Señor, es la verdad; santifícanos en la verdad. Aleluya.',
      text: 'En aquel tiempo, Jesús dijo a sus discípulos esta parábola: «¿Acaso puede un ciego guiar a otro ciego? ¿No caerán los dos en el hoyo? El discípulo no es más que su maestro; si se deja instruir, llegará a ser como su maestro. ¿Por qué te fijas en la mota que tiene tu hermano en el ojo y no reparas en la viga que llevas en el tuyo? ¿Cómo puedes decirle a tu hermano: "Hermano, déjame que te saque la mota del ojo", sin fijarte en la viga que llevas en el tuyo? ¡Hipócrita! Sácate primero la viga de tu ojo, y entonces verás claro para sacar la mota del ojo de tu hermano».'
    }
  },

  '2026-09-12': {
    date: '2026-09-12',
    formattedDate: 'sábado, septiembre 12',
    title: 'Sábado de la XXIII semana del Tiempo Ordinario',
    season: 'Fiesta / Solemnidad',
    color: 'white',
    colorName: 'Santísimo Nombre de María',
    saint: {
      name: 'El Santísimo Nombre de la Virgen María',
      title: 'Memoria libre mariana',
      shortBio: 'Fiesta instituida en honor a la Madre de Dios, cuyo santísimo nombre infunde consuelo a los afligidos, luz a los que dudan y fortaleza a los combatientes de la fe.',
      fullBio: 'El nombre de María, que en hebreo significa "Estrella del Mar" o "Señora amada de Dios", ha sido desde los inicios del cristianismo un refugio sagrado. San Bernardo de Claraval exhortaba: "Si se levantan los vientos de las tentaciones, mira a la estrella, invoca a María". Fue extendida a toda la Iglesia universal tras la liberación de Viena en 1683.',
      patronage: 'Protección maternal, toda la Iglesia',
      prayer: 'Concédenos, Señor todopoderoso, que a cuantos celebramos con gozo el glorioso Nombre de la Santísima Virgen María, ella nos obtenga los dones de tu clemencia en la tierra y la gloria perpetua en el cielo. Por Jesucristo nuestro Señor. Amén.'
    },
    firstReading: {
      citation: '1 Corintios 10:14-22',
      text: 'Queridos míos, huid de la idolatría. Os hablo como a personas sensatas; juzgad vosotros mismos lo que digo. La copa de bendición que bendecimos, ¿no es comunión con la sangre de Cristo? Y el pan que partimos, ¿no es comunión con el cuerpo de Cristo? El pan es uno, y así nosotros, aunque somos muchos, formamos un solo cuerpo, porque todos participamos de ese único pan.'
    },
    psalm: {
      citation: 'Salmo 116:12-13, 17-18',
      response: 'Te ofreceré, Señor, un sacrificio de alabanza.',
      verses: [
        '¿Cómo pagaré al Señor todo el bien que me ha hecho? Alzaré la copa de la salvación, invocando el nombre del Señor.',
        'Cumpliré mis votos al Señor en presencia de todo su pueblo. Te ofreceré un sacrificio de alabanza, invocando tu nombre.'
      ]
    },
    gospel: {
      citation: 'Lucas 6:43-49',
      acclamation: 'Aleluya, aleluya. El que me ama guardará mi palabra, y mi Padre lo amará, y vendremos a él. Aleluya.',
      text: 'En aquel tiempo, decía Jesús a sus discípulos: «No hay árbol bueno que dé fruto malo, ni árbol malo que dé fruto bueno; por ello, cada árbol se conoce por sus frutos; porque no se cosechan higos de las zarzas, ni se vendimian racimos de los espinos. El hombre bueno, de la bondad que atesora en su corazón saca el bien, y el que es malo, de la maldad saca el mal; porque de lo que rebosa el corazón, habla la boca. ¿Por qué me llamáis: "Señor, Señor", y no hacéis lo que os digo? El que se acerca a mí, escucha mis palabras y las pone por obra... se parece a uno que edificó una casa: cavó, ahondó y puso los cimientos sobre roca; vino una crecida, el caudal rompió contra aquella casa, y no pudo moverla, porque estaba bien construida».'
    }
  },

  '2026-09-13': {
    date: '2026-09-13',
    formattedDate: 'domingo, septiembre 13',
    title: 'XXIV Domingo del Tiempo Ordinario (Ciclo A)',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario - Ciclo A',
    saint: {
      name: 'San Juan Crisóstomo',
      title: 'Obispo de Constantinopla y Doctor de la Iglesia',
      shortBio: 'Patriarca de Constantinopla y gran Padre de la Iglesia de Oriente, llamado «Boca de Oro» por la celestial unción de su elocuencia. Defendió con celo intrépido la justicia evangélica.',
      fullBio: 'Nacido en Antioquía hacia el año 347, fue un contemplativo asceta y extraordinario predicador de la Sagrada Escritura. Elegido obispo de Constantinopla, reformó con valentía las costumbres del clero y la corte imperial, y defendió siempre a los pobres. Desterrado en dos ocasiones por proclamar la verdad, murió en el exilio exclamando: «¡Gloria a Dios por todo!». Es patrono universal de los predicadores y catequistas católicos.',
      patronage: 'Predicadores, oradores, Constantinopla',
      prayer: 'Dios nuestro, fortaleza de los que esperan en ti, que hiciste resplandecer a San Juan Crisóstomo por su admirable elocuencia y su fortaleza en el sufrimiento, concédenos aprender de sus enseñanzas y ser sostenidos por el ejemplo de su paciencia. Por Jesucristo nuestro Señor. Amén.'
    },
    firstReading: {
      citation: 'Eclesiástico (Sirácide) 27, 33 – 28, 9',
      text: 'Cosas abominables son el rencor y la ira, en ambas cosas el pecador se ceba. Quien se venga del prójimo sufrirá la venganza del Señor, que llevará cuenta rigurosa de todos sus pecados. Perdona a tu prójimo la ofensa cometida, y se te perdonarán tus pecados cuando reces. ¿Cómo puede un hombre guardar rencor a otro y pedir a Dios la curación? No tiene compasión de su semejante, ¿y se atreve a pedir perdón de sus pecados? Él, que no es más que carne, guarda rencor, ¿quién le perdonará sus pecados? Acuérdate de tu fin y deja de odiar; acuérdate de la corrupción y de la muerte, y guarda los mandamientos. Acuérdate de los mandamientos y no guardes rencor a tu prójimo; acuérdate de la alianza del Altísimo y perdona la falta.'
    },
    psalm: {
      citation: 'Salmo 102 (103), 1-2. 3-4. 9-10. 11-12',
      response: 'El Señor es compasivo y misericordioso, lento a la ira y rico en clemencia.',
      verses: [
        'Bendice, alma mía, al Señor, y todo mi ser a su santo nombre. Bendice, alma mía, al Señor, y no olvides sus beneficios.',
        'Él perdona todas tus culpas y cura todas tus enfermedades; él rescata tu vida de la fosa y te colma de gracia y de ternura.',
        'No está siempre acusando ni guarda rencor perpetuo. No nos trata como merecen nuestros pecados ni nos paga según nuestras culpas.',
        'Como se alza el cielo sobre la tierra, se alza su bondad sobre los que lo temen; como dista el oriente del ocaso, así aleja de nosotros nuestros delitos.'
      ]
    },
    secondReading: {
      citation: 'Carta del apóstol san Pablo a los romanos 14, 7-9',
      text: 'Hermanos: Ninguno de nosotros vive para sí mismo y ninguno muere para sí mismo. Si vivimos, vivimos para el Señor; si morimos, morimos para el Señor; así pues, ya vivamos ya muramos, somos del Señor. Para esto murió y resucitó Cristo: para ser Señor de muertos y vivos.'
    },
    gospel: {
      citation: 'Santo Evangelio según san Mateo 18, 21-35',
      acclamation: 'Aleluya, aleluya. Os doy un mandamiento nuevo: que os améis unos a otros como yo os he amado. Aleluya.',
      text: 'En aquel tiempo, se acercó Pedro a Jesús y le preguntó: «Señor, si mi hermano me ofende, ¿cuántas veces tengo que perdonarlo? ¿Hasta siete veces?». Jesús le contesta: «No te digo hasta siete veces, sino hasta setenta veces siete.\n\nPor esto, se parece el reino de los cielos a un rey que quiso ajustar las cuentas con sus criados. Al empezar a ajustarlas, le presentaron uno que debía diez mil talentos. Como no tenía con qué pagar, el señor mandó que lo vendieran a él con su mujer y sus hijos y todas sus posesiones, y que pagara así. El criado, arrojándose a sus pies, le suplicaba diciendo: "Ten paciencia conmigo y te lo pagaré todo". Se compadeció el señor de aquel criado y lo dejó marchar, perdonándole la deuda.\n\nPero, al salir, aquel criado encontró a uno de sus compañeros que le debía cien denarios y, agarrándolo, lo estrangulaba diciendo: "Págame lo que me debes". El compañero, arrojándose a sus pies, le rogaba diciendo: "Ten paciencia conmigo y te lo pagaré". Pero él se negó y fue y lo metió en la cárcel hasta que pagase lo que debía.\n\nSus compañeros, al ver lo ocurrido, quedaron consternados y fueron a contarle a su señor todo lo sucedido. Entonces el señor lo llamó y le dijo: "¡Siervo malvado! Toda aquella deuda te la perdoné porque me lo rogaste. ¿No debías tú también tener compasión de tu compañero, como yo tuve compasión de ti?". Y el señor, indignado, lo entregó a los verdugos hasta que pagara toda la deuda.\n\nLo mismo hará con vosotros mi Padre celestial, si cada uno no perdona de corazón a su hermano».'
    }
  },

  '2026-09-14': {
    date: '2026-09-14',
    formattedDate: 'lunes, septiembre 14',
    title: 'Lunes de la XXIV semana del Tiempo Ordinario',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario (Verde)',
    saint: {
      name: 'San Juan Crisóstomo / La Exaltación de la Santa Cruz',
      title: 'Feria del Tiempo Ordinario • Memoria de la Cruz',
      shortBio: 'Celebramos la feria de la XXIV semana del Tiempo Ordinario, contemplando la fe humilde del centurión de Cafarnaún que asombra a Jesús.',
      fullBio: 'En la liturgia ferial de este día, la Palabra de Dios nos propone la humildad del siervo de Cristo y la fe sin reservas. Asimismo, la Iglesia hace memoria del misterio de la Santa Cruz redentora como trono de misericordia y signo de salvación universal.',
      patronage: 'Toda la Iglesia, la humildad en la fe',
      prayer: 'Señor Dios todopoderoso, que ensalzas a los humildes y miras con bondad a quienes confían en tu poder, concédenos a ejemplo del centurión una fe inquebrantable en tu santa Palabra. Por Jesucristo nuestro Señor. Amén.'
    },
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
    },
    gospel: {
      citation: 'Lucas 7, 1-10',
      acclamation: 'Aleluya, aleluya. Tanto amó Dios al mundo que entregó a su Hijo único; todo el que cree en él tiene vida eterna. Aleluya.',
      text: 'En aquel tiempo, cuando Jesús terminó de decir todas estas cosas al pueblo, entró en Cafarnaún. Había allí un centurión que tenía un criado enfermo y a punto de morir, a quien estimaba mucho. Habiendo oído hablar de Jesús, le envió unos ancianos de los judíos para rogarle que viniera a salvar a su criado. Ellos, llegados a Jesús, le rogaban con insistencia, diciendo: «Merece que se lo concedas, pues ama a nuestro pueblo y él mismo nos ha edificado la sinagoga». Jesús fue con ellos. Ya no estaba lejos de la casa cuando el centurión envió unos amigos a decirle: «Señor, no te molestes, pues no soy digno de que entres bajo mi techo; por eso ni siquiera me consideré digno de ir a ti en persona. Dilo de palabra, y mi criado quedará sano. Porque también yo soy un hombre sometido a autoridad y tengo soldados a mis órdenes; y digo a uno: "Ve", y va; y a otro: "Ven", y viene; y a mi criado: "Haz esto", y lo hace». Al oír esto, Jesús quedó admirado de él y, volviéndose a la multitud que lo seguía, dijo: «Os digo que ni en Israel he encontrado una fe tan grande». Y al volver a casa, los enviados encontraron al criado sano.'
    },
    alternativeCelebration: {
      title: 'Fiesta de la Exaltación de la Santa Cruz',
      season: 'Fiesta / Solemnidad',
      color: 'red',
      colorName: 'Fiesta del Señor (Rojo)',
      firstReading: {
        citation: 'Números 21:4b-9',
        text: 'En aquellos días, el pueblo de Israel se impacientó por el camino y habló contra Dios y contra Moisés: «¿Por qué nos hiciste subir de Egipto para que muramos en el desierto? No tenemos pan ni agua, y nos da náuseas este pan sin sustancia». Entonces el Señor envió serpientes abrasadoras, que mordían al pueblo, y murieron muchos israelitas. El pueblo acudió a Moisés: «Hemos pecado al hablar contra el Señor y contra ti. Ruega al Señor que aparte de nosotros estas serpientes». Moisés oró por el pueblo, y el Señor le dijo: «Haz una serpiente y colócala en un asta; el que haya sido mordido y la mire, vivirá». Hizo Moisés una serpiente de bronce y la colocó en un asta; y cuando una serpiente mordía a uno, miraba a la serpiente de bronce y quedaba curado.'
      },
      psalm: {
        citation: 'Salmo 78:1-2, 34-35, 36-37, 38',
        response: 'No olvidéis las acciones del Señor.',
        verses: [
          'Escucha, pueblo mío, mi enseñanza, inclina tu oído a las palabras de mi boca. Abriré mi boca a los proverbios, publicaré los enigmas del pasado.',
          'Cuando los hacía morir, lo buscaban, y madrugaban para volverse a Dios. Se acordaban de que Dios era su Roca, el Dios Altísimo su libertador.',
          'Pero lo engañaban con su boca, le mentían con su lengua; su corazón no era sincero con él, no eran fieles a su alianza.'
        ]
      },
      secondReading: {
        citation: 'Filipenses 2:6-11',
        text: 'Cristo Jesús, siendo de condición divina, no retuvo ávidamente el ser igual a Dios; al contrario, se despojó de sí mismo tomando la condición de esclavo, hecho semejante a los hombres. Y así, actuando como un hombre cualquiera, se rebajó hasta someterse incluso a la muerte, y una muerte de cruz. Por eso Dios lo exaltó sobre todo y le concedió el Nombre-sobre-todo-nombre; de modo que al nombre de Jesús toda rodilla se doble en el cielo, en la tierra, en el abismo, y toda lengua proclame: Jesucristo es Señor, para gloria de Dios Padre.'
      },
      gospel: {
        citation: 'Juan 3:13-17',
        acclamation: 'Te adoramos, oh Cristo, y te bendecimos, porque con tu Santa Cruz redimiste al mundo.',
        text: 'En aquel tiempo, dijo Jesús a Nicodemo: «Nadie ha subido al cielo sino el que bajó del cielo, el Hijo del hombre. Lo mismo que Moisés elevó la serpiente en el desierto, así tiene que ser elevado el Hijo del hombre, para que todo el que cree en él tenga vida eterna. Porque tanto amó Dios al mundo, que entregó a su Unigénito, para que todo el que cree en él no perezca, sino que tenga vida eterna. Porque Dios no envió a su Hijo al mundo para juzgar al mundo, sino para que el mundo se salve por él».'
      }
    }
  },

  '2026-09-15': {
    date: '2026-09-15',
    formattedDate: 'martes, septiembre 15',
    title: 'Martes de la XXIV semana del Tiempo Ordinario • Memoria de Nuestra Señora de los Dolores',
    season: 'Tiempo Ordinario',
    color: 'white',
    colorName: 'Nuestra Señora de los Dolores (Blanco)',
    saint: {
      name: 'Nuestra Señora de los Dolores',
      title: 'Memoria obligatoria de la Santísima Virgen',
      shortBio: 'Conmemoramos la profunda compasión de la Virgen María junto a la Cruz de su Divino Hijo, cumpliéndose la profecía del anciano Simeón: "A ti misma una espada te traspasará el alma".',
      fullBio: 'Al día siguiente de la Exaltación de la Santa Cruz, la Iglesia venera los dolores de María Santísima. Ella estuvo firme (Stabat Mater) al pie del Calvario, uniendo su dolor de Madre al sacrificio redentor de Cristo. En las ferias del Tiempo Ordinario, la Iglesia proclama las lecturas de la feria según el Leccionario para no interrumpir la lectura continua de San Lucas.',
      patronage: 'Afligidos, personas en duelo, madres',
      prayer: 'Dios todopoderoso, que quisiste que la Madre de tu Hijo estuviera de pie junto a la Cruz, participando de sus sufrimientos, concede a tu Iglesia que, asociada con María a la Pasión de Cristo, merezca participar también de su gloriosa Resurrección. Por Jesucristo nuestro Señor. Amén.'
    },
    firstReading: {
      citation: '1 Corintios 12, 12-14. 27-31a',
      text: 'Hermanos: Así como el cuerpo es uno y tiene muchos miembros, pero todos los miembros del cuerpo, siendo muchos, son un solo cuerpo, así también es Cristo. Porque en un solo Espíritu fuimos todos bautizados en un solo cuerpo, ya seamos judíos o griegos, esclavos o libres; y a todos se nos dio a beber de un mismo Espíritu. Pues el cuerpo no consta de un solo miembro, sino de muchos... Ahora bien, vosotros sois el cuerpo de Cristo y cada uno es un miembro... Ambicionad, pues, los carismas mejores.'
    },
    psalm: {
      citation: 'Salmo 99, 1-2. 3. 4. 5',
      response: 'Somos su pueblo y ovejas de su rebaño.',
      verses: [
        'Aclama al Señor, tierra entera, servid al Señor con alegría; entrad en su presencia con vítores.',
        'Sabed que el Señor es Dios: que él nos hizo y somos suyos, su pueblo y ovejas de su rebaño.',
        'Entrad por sus puertas con acción de gracias, por sus atrios con himnos, dándole gracias y bendiciendo su nombre: «El Señor es bueno, su misericordia es eterna, su fidelidad por todas las edades».'
      ]
    },
    gospel: {
      citation: 'Lucas 7, 11-17',
      acclamation: 'Aleluya, aleluya. Un gran profeta ha surgido entre nosotros y Dios ha visitado a su pueblo. Aleluya.',
      text: 'En aquel tiempo, iba Jesús camino de una ciudad llamada Naín, y caminaban con él sus discípulos y mucho gentío. Cuando se acercaba a la puerta de la ciudad, resultó que sacaban a enterrar a un difunto, hijo único de su madre, que era viuda; y un gentío considerable de la ciudad la acompañaba. Al verla, el Señor se compadeció de ella y le dijo: «No llores». Se acercó y tocó el féretro. Los que lo llevaban se pararon. Dijo él: «¡Muchacho, a ti te digo, levántate!». El muerto se incorporó y empezó a hablar, y se lo entregó a su madre. Todos, sobrecogidos de temor, daban gloria a Dios, diciendo: «Un gran profeta ha surgido entre nosotros», y «Dios ha visitado a su pueblo». Este hecho se divulgó por toda Judea y por toda la comarca circundante.'
    },
    alternativeCelebration: {
      title: 'Memoria de Nuestra Señora de los Dolores (Lecturas Marianas Facultativas)',
      season: 'Fiesta / Solemnidad',
      color: 'white',
      colorName: 'Nuestra Señora de los Dolores (Lecturas Propias)',
      firstReading: {
        citation: 'Hebreos 5:7-9',
        text: 'Cristo, en los días de su vida mortal, a gritos y con lágrimas, presentó oraciones y súplicas al que podía salvarlo de la muerte, siendo escuchado por su piedad filial. Y, aun siendo Hijo, aprendió, sufriendo, a obedecer. Y, llevado a la consumación, se ha convertido para todos los que le obedecen en autor de salvación eterna.'
      },
      psalm: {
        citation: 'Salmo 31:2-3b, 3cd-4, 5-6, 15-16, 20',
        response: 'Sálvame, Señor, por tu misericordia.',
        verses: [
          'A ti, Señor, me acojo, no quede yo nunca defraudado; tú, que eres justo, ponme a salvo. Inclina tu oído hacia mí, ven aprisa a librarme.',
          'Sé la roca de mi refugio, un baluarte donde me salve, tú que eres mi roca y mi baluarte; por tu nombre dirígeme y guíame.',
          'Sácame de la red que me han tendido, porque tú eres mi amparo. A tus manos encomiendo mi espíritu: tú, el Dios leal, me librarás.'
        ]
      },
      gospel: {
        citation: 'Juan 19:25-27',
        acclamation: 'Dichosa tú, Virgen María, que sin morir mereciste la palma del martirio junto a la cruz del Señor.',
        text: 'En aquel tiempo, junto a la cruz de Jesús estaban su madre, la hermana de su madre, María, la de Cleofás, y María Magdalena. Jesús, al ver a su madre y junto a ella al discípulo que él amaba, dijo a su madre: «Mujer, ahí tienes a tu hijo». Luego, dijo al discípulo: «Ahí tienes a tu madre». Y desde aquella hora, el discípulo la acogió en su casa.'
      }
    }
  },

  '2026-09-16': {
    date: '2026-09-16',
    formattedDate: 'miércoles, septiembre 16',
    title: 'Miércoles de la XXIV semana del Tiempo Ordinario • Santos Cornelio y Cipriano',
    season: 'Fiesta / Solemnidad',
    color: 'red',
    colorName: 'Santos Cornelio y Cipriano, Mártires',
    saint: {
      name: 'San Cornelio, papa, y San Cipriano, obispo',
      title: 'Santos mártires del siglo III',
      shortBio: 'San Cornelio, papa, y San Cipriano, obispo de Cartago, defendieron con ardor la unidad de la Iglesia y la misericordia reconciliadora con los caídos.',
      fullBio: 'Ambos pastores sufrieron el martirio durante la violenta persecución del emperador Valeriano. Mantuvieron una fraterna correspondencia epistolar que fortaleció a las comunidades cristianas en tiempos de prueba suprema.',
      patronage: 'Unidad de la Iglesia, Norte de África, perdón sacramental',
      prayer: 'Dios todopoderoso, que diste a tu pueblo en los santos mártires Cornelio y Cipriano pastores solícitos y testigos intrépidos, concédenos por su intercesión ser firmes en la fe y perseverantes en la caridad fraterna. Por Jesucristo nuestro Señor. Amén.'
    },
    firstReading: {
      citation: '1 Corintios 12, 31 — 13, 13',
      text: 'Hermanos: Ambicionad los carismas mejores. Y aún os voy a mostrar un camino más excelente. Si hablara las lenguas de los hombres y de los ángeles, pero no tengo amor, no sería más que bronce que resuena o címbalo que aturde... El amor es paciente, es benigno; el amor no tiene envidia, no presume, no se engríe; no es indecoroso ni egoísta, no se irrita ni lleva cuentas del mal. Todo lo disculpa, todo lo cree, todo lo espera, todo lo soporta. El amor no pasa nunca. Ahora permanecen la fe, la esperanza y el amor: estas tres; pero la mayor de ellas es el amor.'
    },
    psalm: {
      citation: 'Salmo 32, 2-3. 4-5. 12 y 22',
      response: 'Dichoso el pueblo que el Señor se escogió como heredad.',
      verses: [
        'Dad gracias al Señor con la cítara, tocad en su honor el arpa de diez cuerdas; cantadle un cántico nuevo, tocad con arte vuestra mejor música.',
        'La palabra del Señor es sincera, y todas sus acciones son leales; él ama la justicia y el derecho, y su misericordia llena la tierra.',
        'Que tu misericordia, Señor, venga sobre nosotros, como lo esperamos de ti.'
      ]
    },
    gospel: {
      citation: 'Lucas 7, 31-35',
      acclamation: 'Aleluya, aleluya. Tus palabras, Señor, son espíritu y son vida; tú tienes palabras de vida eterna. Aleluya.',
      text: 'En aquel tiempo, dijo el Señor: «¿A quién se parecen los hombres de esta generación? ¿A quién los compararemos? Se parecen a unos niños sentados en la plaza, que se gritan unos a otros: "Tocamos la flauta y no bailasteis; cantamos lamentaciones y no llorasteis". Porque vino Juan el Bautista, que no comía pan ni bebía vino, y decíais: "Tiene un demonio". Vino el Hijo del hombre, que come y bebe, y decís: "Mirad qué hombre comilón y bebedor de vino, amigo de publicanos y pecadores". Sin embargo, la sabiduría se ha acreditado por todos sus hijos».'
    }
  },

  '2026-09-17': {
    date: '2026-09-17',
    formattedDate: 'jueves, septiembre 17',
    title: 'Jueves de la XXIV semana del Tiempo Ordinario • San Roberto Belarmino',
    season: 'Tiempo Ordinario',
    color: 'white',
    colorName: 'San Roberto Belarmino, Doctor',
    saint: {
      name: 'San Roberto Belarmino',
      title: 'Obispo, cardenal y doctor de la Iglesia',
      shortBio: 'Jesuita ilustre, teólogo y catequista insigne, defendió con sabiduría y mansedumbre la fe católica.',
      fullBio: 'Nacido en Montepulciano, compuso las célebres Controversias teológicas y un catecismo popular que formó a generaciones enteras. Destacó por su profunda humildad y su caridad con los pobres.',
      patronage: 'Catequistas, canonistas y apologistas',
      prayer: 'Dios nuestro, que concediste a San Roberto Belarmino una sabiduría admirable para defender la fe de tu Iglesia, concédenos por su intercesión permanecer siempre fieles al Evangelio. Por Jesucristo nuestro Señor. Amén.'
    },
    firstReading: {
      citation: '1 Corintios 15, 1-11',
      text: 'Os recuerdo, hermanos, el Evangelio que os proclamé y que vosotros aceptasteis, y en el que os mantenéis firmes: por el cual también sois salvados si lo retenéis tal como os lo anuncié... Porque yo os transmití en primer lugar lo que a mi vez recibí: que Cristo murió por nuestros pecados según las Escrituras; y que fue sepultado y que resucitó al tercer día, según las Escrituras; y que se apareció a Cefas y más tarde a los Doce. Así pues, tanto ellos como yo predicamos así, y así lo habéis creído.'
    },
    psalm: {
      citation: 'Salmo 117, 1-2. 16ab-17. 28',
      response: 'Dad gracias al Señor porque es bueno, porque es eterna su misericordia.',
      verses: [
        'Diga la casa de Israel: eterna es su misericordia. Diga la casa de Aarón: eterna es su misericordia.',
        'La diestra del Señor es excelsa, la diestra del Señor hace proezas. No he de morir, viviré para contar las hazañas del Señor.',
        'Tú eres mi Dios, te doy gracias; Dios mío, yo te ensalzo. Dad gracias al Señor porque es bueno, porque es eterna su misericordia.'
      ]
    },
    gospel: {
      citation: 'Lucas 7, 36-50',
      acclamation: 'Aleluya, aleluya. Venid a mí todos los que estáis cansados y agobiados, y yo os aliviaré, dice el Señor. Aleluya.',
      text: 'En aquel tiempo, un fariseo rogaba a Jesús que fuera a comer con él. Jesús, entrando en casa del fariseo, se puso a la mesa. Y una mujer que había en la ciudad, una pecadora, al saber que estaba comiendo en casa del fariseo, se acercó por detrás llorando, y con sus lágrimas empezó a regar sus pies, se los secaba con sus cabellos, los cubría de besos y se los ungía con perfume... Jesús dijo a Simón: «¿Ves a esta mujer? Sus muchos pecados le son perdonados, porque ha amado mucho; a quien poco se le perdona, poco ama». Y a ella le dijo: «Tus pecados están perdonados. Tu fe te ha salvado; vete en paz».'
    }
  },

  '2026-09-18': {
    date: '2026-09-18',
    formattedDate: 'viernes, septiembre 18',
    title: 'Viernes de la XXIV semana del Tiempo Ordinario',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario',
    saint: {
      name: 'San José de Cupertino',
      title: 'Presbítero franciscano',
      shortBio: 'Fraile menor conventual dotado de un amor celestial por Dios y célebre por sus éxtasis místicos.',
      fullBio: 'A pesar de sus limitaciones académicas iniciales, Dios le colmó de sabiduría sobrenatural y dones carismáticos extraordinarios. Es venerado como patrono celestial de los estudiantes y de los aviadores.',
      patronage: 'Estudiantes en exámenes, pilotos y viajeros',
      prayer: 'Señor Dios todopoderoso, que ensalzas a los humildes y derramas tu gracia sobre los sencillos de corazón, concédenos a ejemplo de San José de Cupertino vivir con pureza y alegría en tu santo amor. Amén.'
    },
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
    },
    gospel: {
      citation: 'Lucas 8, 1-3',
      acclamation: 'Aleluya, aleluya. Bendito seas, Padre, Señor de cielo y tierra, porque has revelado los secretos del Reino a los sencillos. Aleluya.',
      text: 'En aquel tiempo, Jesús iba caminando de ciudad en ciudad y de aldea en aldea, proclamando y anunciando la Buena Noticia del reino de Dios. Lo acompañaban los Doce y algunas mujeres que habían sido curadas de espíritus malos y de enfermedades: María, llamada la Magdalena, de la que habían salido siete demonios; Juana, mujer de Cusa, administrador de Herodes; Susana y otras muchas que le servían con sus propios bienes.'
    }
  },

  '2026-09-19': {
    date: '2026-09-19',
    formattedDate: 'sábado, septiembre 19',
    title: 'Sábado de la XXIV semana del Tiempo Ordinario • San Jenaro',
    season: 'Tiempo Ordinario',
    color: 'red',
    colorName: 'San Jenaro, Mártir',
    saint: {
      name: 'San Jenaro',
      title: 'Obispo y mártir',
      shortBio: 'Obispo de Benevento martirizado bajo la persecución de Diocleciano, célebre protector celestial de Nápoles.',
      fullBio: 'Arrestado por socorrer a cristianos encarcelados, dio testimonio de su fe en Cristo con el derramamiento de su sangre en Pozzuoli en el año 305. El milagro de la licuefacción de su sangre continúa asombrando al mundo cada año.',
      patronage: 'Nápoles, donantes de sangre, víctimas de erupciones volcánicas',
      prayer: 'Señor Dios, que nos alegras con la celebración anual de San Jenaro, mártir de la fe, concédenos ser fortalecidos con su celestial intercesión y perseverar firmes ante cualquier adversidad. Amén.'
    },
    firstReading: {
      citation: '1 Corintios 15, 35-37. 42-49',
      text: 'Hermanos: Dirá alguno: «¿Cómo resucitan los muertos? ¿Con qué cuerpo vendrán?». ¡Insensato! Lo que tú siembras no recobra vida si antes no muere... Así es también la resurrección de los muertos: se siembra en corrupción, resucita en incorrupción; se siembra en deshonra, resucita en gloria; se siembra en debilidad, resucita en poder; se siembra un cuerpo natural, resucita un cuerpo espiritual. Así como hemos llevado la imagen del hombre terrenal, llevaremos también la imagen del celestial.'
    },
    psalm: {
      citation: 'Salmo 55, 10-11ab. 11c-12. 13-14',
      response: 'Caminaré en la presencia de Dios a la luz de la vida.',
      verses: [
        'Mis enemigos retrocederán cuando yo te invoque; bien sé que Dios está de mi parte.',
        'En Dios, cuya palabra alabo, en Dios confío y no temo: ¿qué podrá hacerme un mortal?',
        'Te cumpliré mis promesas, oh Dios, te ofreceré sacrificios de alabanza, porque libraste mi alma de la muerte y mis pies de la caída, para caminar delante de Dios a la luz de la vida.'
      ]
    },
    gospel: {
      citation: 'Lucas 8, 4-15',
      acclamation: 'Aleluya, aleluya. La semilla es la palabra de Dios; el sembrador es Cristo; quien lo encuentra vive para siempre. Aleluya.',
      text: 'En aquel tiempo, habiéndose reunido una gran muchedumbre y acudiendo a él gentes de todas las ciudades, dijo Jesús en parábola: «Salió el sembrador a sembrar su semilla. Al sembrar, una parte cayó junto al camino, fue pisoteada y las aves del cielo se la comieron. Otra cayó sobre roca, y en cuanto brotó, se secó por falta de humedad. Otra cayó entre espinos, y los espinos crecieron con ella y la ahogaron. Y otra cayó en tierra buena, y creció y dio fruto al ciento por uno».\n\nSus discípulos le preguntaron el significado: «La semilla es la palabra de Dios... Lo que cayó en tierra buena son los que escuchan la palabra con un corazón noble y bueno, la retienen y dan fruto por su perseverancia».'
    }
  },

  '2026-09-20': {
    date: '2026-09-20',
    formattedDate: 'domingo, septiembre 20',
    title: 'XXV Domingo del Tiempo Ordinario (Ciclo A)',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario',
    saint: {
      name: 'San Andrés Kim Taegon, San Pablo Chong Hasang y compañeros',
      title: 'Mártires de Corea',
      shortBio: 'Primer sacerdote coreano y sus compañeros que sembraron con heroísmo la semilla viva del Evangelio en Corea.',
      fullBio: 'Durante el siglo XIX, miles de fieles coreanos derramaron su sangre por testimoniar la soberanía de Jesucristo. San Andrés Kim fue decapitado a los 25 años tras proclamar valientemente su fe católica.',
      patronage: 'Corea, sacerdotes perseguidos, la misión en Asia',
      prayer: 'Dios todopoderoso, que suscitaste en Corea una admirable multitud de mártires, concédenos por su intercesión ser generosos en la fe y perseverantes en la confesión del Nombre de Jesucristo. Amén.'
    },
    firstReading: {
      citation: 'Isaías 55, 6-9',
      text: 'Buscad al Señor mientras se deja encontrar, invocadlo mientras está cerca. Deje el impío su camino, y el hombre inicuo sus pensamientos, y vuélvase al Señor, que tendrá piedad de él, y a nuestro Dios, que es rico en perdón. Porque mis pensamientos no son vuestros pensamientos, ni vuestros caminos mis caminos —oráculo del Señor—. Cuanto son más altos los cielos que la tierra, tanto son mis caminos más altos que vuestros caminos, y mis pensamientos más que vuestros pensamientos.'
    },
    psalm: {
      citation: 'Salmo 144, 2-3. 8-9. 17-18',
      response: 'Cerca está el Señor de todos los que lo invocan.',
      verses: [
        'Día tras día te bendeciré, alabaré tu nombre por siempre jamás. Grande es el Señor y muy digno de alabanza, su grandeza es insondable.',
        'El Señor es clemente y misericordioso, lento a la cólera y rico en piedad; el Señor es bueno con todos, es cariñoso con todas sus criaturas.',
        'El Señor es justo en todos sus caminos, es bondadoso en todas sus obras; cerca está el Señor de todos los que lo invocan, de los que lo invocan sinceramente.'
      ]
    },
    secondReading: {
      citation: 'Filipenses 1, 20c-24. 27a',
      text: 'Hermanos: Cristo será glorificado en mi cuerpo, tanto por mi vida como por mi muerte. Porque para mí la vida es Cristo y una ganancia el morir. Pero si el vivir en este cuerpo me permite cosechar fruto de mi trabajo, no sé qué escoger: me siento apremiado por las dos cosas; deseo partir para estar con Cristo, que es con mucho lo mejor, pero quedarme en el cuerpo es más necesario para vuestro bien. Solamente os pido que llevéis una vida digna del Evangelio de Cristo.'
    },
    gospel: {
      citation: 'Mateo 20, 1-16',
      acclamation: 'Aleluya, aleluya. Ábrenos, Señor, el corazón, para que aceptemos las palabras de tu Hijo. Aleluya.',
      text: 'En aquel tiempo, dijo Jesús a sus discípulos esta parábola: «El reino de los cielos se parece a un propietario que salió a primera hora de la mañana a contratar obreros para su viña. Habiendo ajustado con los obreros en un denario al día, los envió a su viña. Salió otra vez a media mañana, vio a otros parados en la plaza y les dijo: "Id también vosotros a mi viña y os daré lo que sea justo". Y ellos fueron. Salió de nuevo al mediodía y a media tarde, e hizo lo mismo. Al caer la tarde dijo el dueño: "Llama a los obreros y págales el jornal, empezando por los últimos hasta los primeros". Vinieron los de la tarde y cobraron un denario cada uno. Cuando llegaron los primeros, pensaron que recibirían más, pero ellos también cobraron un denario. Al recibirlo, protestaban contra el amo: "Estos últimos han trabajado una hora y los has tratado igual que a nosotros". Pero él contestó a uno de ellos: "Amigo, no te hago ninguna injusticia. ¿No quedamos en un denario? ¿O es que vas a tener tú envidia porque yo soy bueno?". Así, los últimos serán los primeros, y los primeros los últimos».'
    }
  },

  '2026-09-21': {
    date: '2026-09-21',
    formattedDate: 'lunes, septiembre 21',
    title: 'Fiesta de San Mateo, Apóstol y Evangelista',
    season: 'Fiesta / Solemnidad',
    color: 'red',
    colorName: 'San Mateo, Apóstol y Evangelista',
    saint: {
      name: 'San Mateo Apóstol',
      title: 'Evangelista y testigo del Resucitado',
      shortBio: 'Publicano en Cafarnaún, llamado de su mesa de recaudación para convertirse en apóstol de Cristo y cronista inspirado de su Evangelio.',
      fullBio: 'Al oír la invitación de Jesús: "Sígueme", Mateo dejó todo de inmediato y ofreció un banquete en su casa para sus amigos. Escribió su Evangelio para proclamar que en Jesucristo se cumplen todas las promesas mesiánicas del Antiguo Testamento.',
      patronage: 'Contadores, recaudadores, banqueros y aduaneros',
      prayer: 'Dios de misericordia infinita, que en tu Hijo Jesucristo elegiste a un cobrador de impuestos para ser contado entre los apóstoles, concédenos por su ejemplo e intercesión que, sostenidos por tu gracia, te sigamos siempre con corazón íntegro. Amén.'
    },
    firstReading: {
      citation: 'Efesios 4, 1-7. 11-13',
      text: 'Hermanos: Os ruego yo, el prisionero por el Señor, que andéis como pide la vocación a la que habéis sido convocados: con toda humildad y mansedumbre, con paciencia, sobrellevándoos mutuamente con amor, esforzándoos por mantener la unidad del Espíritu con el vínculo de la paz. Un solo cuerpo y un solo Espíritu... A cada uno de nosotros se le ha dado la gracia según la medida del don de Cristo. Y él ha constituido a unos, apóstoles; a otros, profetas; a otros, evangelizadores... hasta que lleguemos todos a la unidad de la fe y a la medida de la plenitud de Cristo.'
    },
    psalm: {
      citation: 'Salmo 18, 2-3. 4-5',
      response: 'A toda la tierra alcanza su pregón.',
      verses: [
        'El cielo proclama la gloria de Dios, el firmamento pregona la obra de sus manos: el día al día le pasa el mensaje, la noche a la noche se lo susurra.',
        'Sin que hablen, sin que pronuncien, sin que resuene su voz, a toda la tierra alcanza su pregón y hasta los límites del orbe su lenguaje.'
      ]
    },
    gospel: {
      citation: 'Mateo 9, 9-13',
      acclamation: 'Aleluya, aleluya. A ti, oh Dios, te alabamos; a ti, Señor, te reconocemos. A ti te ensalza el glorioso coro de los apóstoles. Aleluya.',
      text: 'En aquel tiempo, vio Jesús al pasar a un hombre llamado Mateo, sentado al mostrador de los impuestos, y le dijo: «Sígueme». Él se levantó y lo siguió. Y estando en la casa, sentado a la mesa, muchos publicanos y pecadores que habían acudido se sentaban con Jesús y sus discípulos. Los fariseos, al ver esto, decían a los discípulos: «¿Cómo es que vuestro maestro come con publicanos y pecadores?». Jesús lo oyó y dijo: «No tienen necesidad de médico los sanos, sino los enfermos. Andad, aprended lo que significa: "Misericordia quiero y no sacrificios"; porque no he venido a llamar a justos, sino a pecadores».'
    }
  },

  '2026-09-27': {
    date: '2026-09-27',
    formattedDate: 'domingo, septiembre 27',
    title: 'XXVI Domingo del Tiempo Ordinario (Ciclo A)',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario',
    saint: {
      name: 'San Vicente de Paúl',
      title: 'Presbítero y apóstol insigne de la caridad',
      shortBio: 'Sacerdote francés fundador de la Congregación de la Misión (Paúles) y de las Hijas de la Caridad, padre providencial de los desamparados.',
      fullBio: 'Dedicó enteramente su existencia al alivio de los marginados, huérfanos y galeotes, enseñando que en los pobres contemplamos el rostro vivo de Jesucristo sufriente.',
      patronage: 'Obras de caridad, voluntarios, hospitales',
      prayer: 'Dios nuestro, que para la salvación de los pobres y la formación del clero infundiste en San Vicente de Paúl un celo apostólico incomparable, haz que nosotros, impulsados por el mismo espíritu, amemos lo que él amó y practiquemos lo que enseñó. Amén.'
    },
    firstReading: {
      citation: 'Ezequiel 18, 25-28',
      text: 'Así dice el Señor: Decís: "No es justo el proceder del Señor". Escuchad, casa de Israel: ¿Es injusto mi proceder? ¿No es vuestro proceder el que es injusto? Cuando el justo se aparta de su justicia, comete la maldad y muere, muere por la maldad que cometió. Y cuando el malvado se convierte de la maldad que hizo y practica el derecho y la justicia, él salvará su vida. Ha reflexionado y se ha apartado de todos los crímenes que había cometido; ciertamente vivirá y no morirá.'
    },
    psalm: {
      citation: 'Salmo 24, 4-5. 6-7. 8-9',
      response: 'Recuerda, Señor, que tu misericordia es eterna.',
      verses: [
        'Señor, enséñame tus caminos, instrúyeme en tus sendas: haz que camine con lealtad; enséñame, porque tú eres mi Dios y Salvador.',
        'Recuerda, Señor, que tu ternura y tu misericordia son eternas. No te acuerdes de los pecados ni de las maldades de mi juventud; acuérdate de mí con misericordia, por tu bondad, Señor.',
        'El Señor es bueno y es recto, y enseña el camino a los pecadores; hace caminar a los humildes con rectitud, enseña su camino a los humildes.'
      ]
    },
    secondReading: {
      citation: 'Filipenses 2, 1-11',
      text: 'Hermanos: Si queréis darme el consuelo de Cristo, el alivio del amor, la comunión en el Espíritu... tened los mismos sentimientos, el mismo amor, un mismo espíritu, un mismo sentir. No hagáis nada por rivalidad ni por vanagloria, sino con humildad, considerando a los demás como superiores a vosotros mismos. Tened entre vosotros los mismos sentimientos de Cristo Jesús, el cual, siendo de condición divina, no retuvo ávidamente el ser igual a Dios; al contrario, se despojó de sí mismo tomando la condición de esclavo... Por eso Dios lo exaltó y le concedió el Nombre sobre todo nombre.'
    },
    gospel: {
      citation: 'Mateo 21, 28-32',
      acclamation: 'Aleluya, aleluya. Mis ovejas escuchan mi voz, dice el Señor, y yo las conozco y ellas me siguen. Aleluya.',
      text: 'En aquel tiempo, dijo Jesús a los sumos sacerdotes y a los ancianos del pueblo: «¿Qué os parece? Un hombre tenía dos hijos. Se acercó al primero y le dijo: "Hijo, ve hoy a trabajar en la viña". Él contestó: "No quiero". Pero más tarde se arrepintió y fue. Se acercó al segundo y le dijo lo mismo. Él contestó: "Voy, señor". Pero no fue. ¿Quién de los dos cumplió la voluntad de su padre?». Contestaron: «El primero». Jesús les dijo: «En verdad os digo que los publicanos y las prostitutas van por delante de vosotros en el reino de Dios. Porque vino Juan a vosotros enseñándoos el camino de la justicia y no le creísteis; en cambio, los publicanos y prostitutas le creyeron; y vosotros, al ver esto, ni siquiera os arrepentisteis después para creer en él».'
    }
  },

  '2026-09-28': {
    date: '2026-09-28',
    formattedDate: 'lunes, septiembre 28',
    title: 'Lunes de la XXVI semana del Tiempo Ordinario • San Wenceslao y San Lorenzo Ruiz',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario (Verde)',
    saint: {
      name: 'San Wenceslao y San Lorenzo Ruiz con compañeros mártires',
      title: 'Mártir y duque de Bohemia / Primer santo mártir de Filipinas',
      shortBio: 'San Wenceslao, gobernante piadoso asesinado por su fe; San Lorenzo Ruiz, padre de familia laico martirizado en Japón: «Si tuviera mil vidas, todas las daría por Cristo».',
      fullBio: 'San Wenceslao promovió la fe cristiana en Bohemia, protegió a viudas y huérfanos y amasaba personalmente el pan para la Santa Eucaristía. San Lorenzo Ruiz, miembro de la Cofradía del Santo Rosario, acompañó a misioneros dominicos a Nagasaki y dio testimonio supremo de Cristo.',
      patronage: 'Filipinas, Bohemia, laicos y perseguidos a causa de la fe',
      prayer: 'Dios todopoderoso y eterno, que diste a tus mártires San Wenceslao y San Lorenzo Ruiz la gracia de derramar su sangre por Cristo, concédenos dar testimonio gozoso de tu Evangelio en medio de las dificultades de la vida presente. Por Jesucristo nuestro Señor. Amén.'
    },
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
    },
    gospel: {
      citation: 'Lucas 9, 46-50',
      acclamation: 'Aleluya, aleluya. El Hijo del hombre ha venido a servir y a dar su vida en rescate por muchos. Aleluya.',
      text: 'En aquel tiempo, se suscitó entre los discípulos una discusión sobre quién sería el mayor de entre ellos. Conociendo Jesús los pensamientos de sus corazones, tomó a un niño, lo puso a su lado y les dijo: «El que acoge a este niño en mi nombre, me acoge a mí; y el que me acoge a mí, acoge al que me ha enviado. Pues el más pequeño de todos vosotros, ese es grande». Entonces Juan tomó la palabra y dijo: «Maestro, hemos visto a uno que expulsaba demonios en tu nombre y se lo hemos prohibido, porque no anda con nosotros». Pero Jesús le respondió: «No se lo prohibáis, porque el que no está contra vosotros, está a favor vuestro».'
    }
  },

  '2026-09-29': {
    date: '2026-09-29',
    formattedDate: 'martes, septiembre 29',
    title: 'Fiesta de los Santos Arcángeles Miguel, Gabriel y Rafael',
    season: 'Fiesta / Solemnidad',
    color: 'white',
    colorName: 'Santos Arcángeles de Dios (Blanco)',
    saint: {
      name: 'Santos Arcángeles Miguel, Gabriel y Rafael',
      title: 'Príncipes de la milicia celestial',
      shortBio: 'Espíritus puros ante el trono de Dios que interceden por nosotros, combaten contra el mal y custodian a la Iglesia.',
      fullBio: 'San Miguel ("¿Quién como Dios?") es el vencedor de Satanás; San Gabriel ("Fortaleza de Dios") es el mensajero de la Encarnación a la Virgen María; San Rafael ("Medicina de Dios") es el compañero fiel y sanador en las pruebas de la vida.',
      patronage: 'Protectores de la Iglesia, enfermos, fuerzas de paz y viajeros',
      prayer: 'San Miguel Arcángel, defiéndenos en la batalla; sé nuestro amparo contra la perversidad y asechanzas del demonio. San Gabriel, alcánzanos una fe viva en Cristo. San Rafael, guía nuestros pasos en el camino de la salvación. Amén.'
    },
    firstReading: {
      citation: 'Daniel 7, 9-10. 13-14',
      text: 'Mientras yo miraba: Se colocaron unos tronos y un Anciano se sentó. Su vestido era blanco como la nieve, su cabellera como lana purísima; su trono, llamas de fuego... Miles y miles le servían, millones estaban de pie ante él. Miré en las visiones nocturnas y vi venir sobre las nubes del cielo a uno como un Hijo de hombre; se acercó al Anciano y fue presentado ante él. Y le fue dado poder, honor y reino, y todos los pueblos, naciones y lenguas le servían. Su poder es un poder eterno, que nunca pasará, y su reino no será destruido jamás.'
    },
    psalm: {
      citation: 'Salmo 137, 1-2a. 2bc-3. 4-5',
      response: 'Delante de los ángeles tañeré para ti, Señor.',
      verses: [
        'Te doy gracias, Señor, de todo corazón, delante de los ángeles tañeré para ti. Me postraré hacia tu santuario, daré gracias a tu nombre por tu misericordia y tu lealtad.',
        'Cuando te invoqué, me escuchaste, acrecentaste el valor en mi alma.',
        'Que te den gracias, Señor, los reyes de la tierra, al escuchar las palabras de tu boca; y canten los caminos del Señor: ¡Qué grande es la gloria del Señor!'
      ]
    },
    gospel: {
      citation: 'Juan 1, 47-51',
      acclamation: 'Aleluya, aleluya. Bendecid al Señor, todos sus ejércitos, ministros suyos que cumplís su voluntad. Aleluya.',
      text: 'En aquel tiempo, vio Jesús que se acercaba Natanael y dijo de él: «Ahí tenéis a un israelita de verdad, en quien no hay engaño». Natanael le contesta: «¿De qué me conoces?». Jesús le responde: «Antes de que Felipe te llamara, cuando estabas debajo de la higuera, te vi». Natanael respondió: «Rabbí, tú eres el Hijo de Dios, tú eres el Rey de Israel». Jesús le contestó: «¿Por haberte dicho que te vi debajo de la higuera crees? Has de ver cosas mayores». Y añadió: «En verdad, en verdad os digo: veréis el cielo abierto y a los ángeles de Dios subir y bajar sobre el Hijo del hombre».'
    },
    alternativeCelebration: {
      title: 'Martes de la XXVI semana del Tiempo Ordinario (Feria ordinaria)',
      season: 'Tiempo Ordinario',
      color: 'green',
      colorName: 'Tiempo Ordinario (Verde)',
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
      },
      gospel: {
        citation: 'Lucas 9, 51-56',
        acclamation: 'Aleluya, aleluya. El Hijo del hombre no ha venido a perder las almas de los hombres, sino a salvarlas. Aleluya.',
        text: 'Cuando se iba cumpliendo el tiempo de su subida al cielo, Jesús tomó la firme resolución de encaminarse a Jerusalén. Y envió mensajeros delante de sí, que fueron y entraron en una aldea de samaritanos para prepararle alojamiento; pero no lo recibieron porque se dirigía a Jerusalén. Al ver esto, los discípulos Santiago y Juan dijeron: «Señor, ¿quieres que mandemos bajar fuego del cielo que acabe con ellos?». Pero él se volvió y los increpó diciendo: «No sabéis de qué espíritu sois, porque el Hijo del hombre no ha venido a perder las vidas de los hombres, sino a salvarlas». Y se fueron a otra aldea.'
      }
    }
  },

  '2026-09-30': {
    date: '2026-09-30',
    formattedDate: 'miércoles, septiembre 30',
    title: 'Miércoles de la XXVI semana del Tiempo Ordinario • Memoria de San Jerónimo',
    season: 'Tiempo Ordinario',
    color: 'white',
    colorName: 'Memoria de San Jerónimo (Blanco)',
    saint: {
      name: 'San Jerónimo',
      title: 'Presbítero y Doctor de la Iglesia',
      shortBio: 'Traductor insigne de la Sagrada Escritura al latín (la Vulgata): «Desconocer las Escrituras es desconocer a Cristo».',
      fullBio: 'Vivió largos años en oración, penitencia y estudio en una gruta de Belén contigua al pesebre de la Natividad de Nuestro Señor. Con amor ardiente por la verdad de la Palabra divina, dedicó su existencia a poner los textos sagrados al alcance de todo el pueblo de Dios.',
      patronage: 'Biblistas, traductores, arqueólogos y bibliotecarios',
      prayer: 'Dios todopoderoso, que concediste a San Jerónimo una estima viva y suave por la Sagrada Escritura, haz que tu pueblo se alimente de tu Palabra con mayor abundancia y encuentre en ella la fuente inagotable de la vida. Amén.'
    },
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
    },
    gospel: {
      citation: 'Lucas 9, 57-62',
      acclamation: 'Aleluya, aleluya. Todo lo considero pérdida ante la sublimidad del conocimiento de Cristo Jesús, mi Señor. Aleluya.',
      text: 'En aquel tiempo, mientras iban de camino, le dijo uno a Jesús: «Te seguiré adondequiera que vayas». Jesús le respondió: «Las zorras tienen madrigueras y los pájaros del cielo nidos, pero el Hijo del hombre no tiene dónde reclinar la cabeza». A otro le dijo: «Sígueme». Él respondió: «Señor, déjame primero ir a enterrar a mi padre». Le contestó: «Deja que los muertos entierren a sus muertos; tú vete a anunciar el reino de Dios». Otro le dijo: «Te seguiré, Señor, pero déjame primero despedirme de los de mi casa». Jesús le dijo: «Nadie que pone la mano en el arado y mira hacia atrás es apto para el reino de Dios».'
    }
  },

  '2026-10-04': {
    date: '2026-10-04',
    formattedDate: 'domingo, octubre 4',
    title: 'XXVII Domingo del Tiempo Ordinario (Ciclo A) • San Francisco de Asís',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario',
    saint: {
      name: 'San Francisco de Asís',
      title: 'Fundador de los Hermanos Menores (Franciscanos)',
      shortBio: 'El "Poverello" de Asís, espejo vivo de Cristo que abrazó la pobreza evangélica, predicó la paz y recibió en su cuerpo los sagrados estigmas de la Pasión.',
      fullBio: 'Renunció a todas sus posesiones temporales para reconstruir la Iglesia de Cristo. Su Cántico de las Criaturas exalta a Dios en toda la creación, inspirando a la humanidad en la fraternidad universal y el amor al Redentor crucificado.',
      patronage: 'Ecología, la paz, animales, Italia',
      prayer: 'Señor, haz de mí un instrumento de tu paz: donde haya odio, ponga yo amor; donde haya ofensa, perdón; donde haya discordia, unión; donde haya error, verdad; donde haya duda, fe; donde haya desesperación, esperanza; donde haya tinieblas, luz; donde haya tristeza, alegría. Amén.'
    },
    firstReading: {
      citation: 'Isaías 5, 1-7',
      text: 'Voy a cantar a mi amigo el canto de su amor por su viña. Mi amigo tenía una viña en una colina fértil. La cavó, la despedregó y plantó cepas escogidas; construyó una torre en medio de ella y excavó un lagar. Esperaba que diera uvas, pero dio agrazones. Y ahora, habitantes de Jerusalén y hombres de Judá, sed jueces entre mí y mi viña: ¿Qué más se podía hacer por mi viña que yo no haya hecho?... Pues la viña del Señor del universo es la casa de Israel, y los hombres de Judá su plantel dilecto. Esperaba derecho, y ahí tenéis derramamiento de sangre; justicia, y ahí tenéis lamentos.'
    },
    psalm: {
      citation: 'Salmo 79, 9. 12. 13-14. 15-16. 19-20',
      response: 'La viña del Señor es la casa de Israel.',
      verses: [
        'Sacaste una vid de Egipto, expulsaste a los gentiles y la trasplantaste; extendió sus sarmientos hasta el mar, y sus brotes hasta el Gran Río.',
        '¿Por qué has derribado su cerca para que la saqueen los viandantes? Dios del universo, vuélvete: mira desde el cielo, fíjate, ven a visitar esta viña.',
        'Protege la cepa que tu mano derecha plantó, el renuevo que tú mismo hiciste fuerte. No nos apartaremos de ti: danos vida, para que invoquemos tu nombre.'
      ]
    },
    secondReading: {
      citation: 'Filipenses 4, 6-9',
      text: 'Hermanos: No os inquietéis por nada; antes bien, en toda ocasión, presentad a Dios vuestras peticiones mediante la oración y la súplica, acompañadas de la acción de gracias. Y la paz de Dios, que sobrepasa todo juicio, custodiará vuestros corazones y vuestros pensamientos en Cristo Jesús. Por lo demás, hermanos, apreciad todo lo que es verdadero, noble, justo, puro, amable, laudable, todo lo que es virtud o mérito. Y el Dios de la paz estará con vosotros.'
    },
    gospel: {
      citation: 'Mateo 21, 33-43',
      acclamation: 'Aleluya, aleluya. Yo os he elegido del mundo para que vayáis y deis fruto, y vuestro fruto permanezca, dice el Señor. Aleluya.',
      text: 'En aquel tiempo, dijo Jesús a los sumos sacerdotes y a los ancianos del pueblo: «Escuchad otra parábola: Había un propietario que plantó una viña, la rodeó con una cerca, cavó en ella un lagar, construyó la torre, la arrendó a unos labradores y se fue de viaje. Llegado el tiempo de los frutos, envió sus criados a los labradores para percibir sus frutos. Pero los labradores agarraron a los criados y a uno lo apalearon, a otro lo mataron y a otro lo lapidaron. Envió de nuevo a otros criados, y les hicieron lo mismo. Por último, les mandó a su hijo diciéndose: "Tendrán respeto a mi hijo". Pero los labradores, al ver al hijo, se dijeron: "Este es el heredero: venid, matémoslo y nos quedaremos con su herencia". Y agarrándolo, lo empujaron fuera de la viña y lo mataron. Cuando vuelva el dueño de la viña, ¿qué hará con aquellos labradores?». Le contestaron: «Hará morir de mala muerte a esos malvados y arrendará la viña a otros labradores que le entreguen los frutos a su tiempo». Jesús les dijo: «Por eso os digo que se os quitará a vosotros el reino de Dios y se le dará a un pueblo que rinda sus frutos».'
    }
  }
};

// Rotating scripture readings for days outside fixed database
const WEEKDAY_READINGS = [
  // 0: Domingo
  {
    firstReading: {
      citation: 'Isaías 55:1-3',
      text: 'Así dice el Señor: Todos los sedientos, venid por agua; y los que no tenéis dinero, venid, comprad y comed. Venid, comprad sin dinero y sin pagar, vino y leche. ¿Por qué gastáis el dinero en lo que no es pan, y vuestro salario en lo que no sacia? Escuchadme atentamente y comed lo que es bueno, y vuestra alma se deleitará con manjares. Inclinad vuestro oído y venid a mí; escuchad, y vivirá vuestra alma.'
    },
    psalm: {
      citation: 'Salmo 23:1-3a, 3b-4, 5, 6',
      response: 'El Señor es mi pastor, nada me falta.',
      verses: [
        'El Señor es mi pastor, nada me falta: en verdes praderas me hace recostar; me conduce hacia fuentes tranquilas y repara mis fuerzas.',
        'Me guía por el sendero justo, por el honor de su nombre. Aunque camine por cañadas oscuras, nada temo, porque tú vas conmigo: tu vara y tu cayado me sosiegan.',
        'Preparas una mesa ante mí, enfrente de mis enemigos; me unges la cabeza con perfume, y mi copa rebosa.',
        'Tu bondad y tu misericordia me acompañan todos los días de mi vida, y habitaré en la casa del Señor por años sin término.'
      ]
    },
    secondReading: {
      citation: '1 Corintios 13:4-8a, 13',
      text: 'Hermanos: El amor es paciente, es benigno; el amor no tiene envidia, no presume, no se engríe, no es indecoroso ni egoísta, no se irrita ni lleva cuentas del mal; no se alegra de la injusticia, sino que goza con la verdad. Todo lo disculpa, todo lo cree, todo lo espera, todo lo soporta. El amor no pasa nunca. Ahora permanecen la fe, la esperanza y el amor: estas tres; pero la mayor de ellas es el amor.'
    },
    gospel: {
      citation: 'Mateo 11:28-30',
      acclamation: 'Aleluya. Tomad mi yugo sobre vosotros y aprended de mí, que soy manso y humilde de corazón. Aleluya.',
      text: 'En aquel tiempo, exclamó Jesús: «Venid a mí todos los que estáis cansados y agobiados, y yo os aliviaré. Tomad mi yugo sobre vosotros y aprended de mí, que soy manso y humilde de corazón, y encontraréis descanso para vuestras almas. Porque mi yugo es llevadero y mi carga ligera».'
    }
  },
  // 1: Lunes
  {
    firstReading: {
      citation: 'Efesios 4:1-6',
      text: 'Hermanos: Os ruego yo, el prisionero por el Señor, que andéis como pide la vocación a la que habéis sido convocados: con toda humildad y mansedumbre, con paciencia, sobrellevándoos mutuamente con amor, esforzándoos por mantener la unidad del Espíritu con el vínculo de la paz. Un solo cuerpo y un solo Espíritu, como una sola es la esperanza de la vocación a la que habéis sido convocados. Un Señor, una fe, un bautismo. Un Dios, Padre de todos, que está sobre todos, actúa por medio de todos y está en todos.'
    },
    psalm: {
      citation: 'Salmo 1:1-2, 3, 4 y 6',
      response: 'Dichoso el hombre que ha puesto su confianza en el Señor.',
      verses: [
        'Dichoso el hombre que no sigue el consejo de los impíos, ni entra por la senda de los pecadores, ni se sienta en la reunión de los cínicos; sino que su gozo es la ley del Señor, y medita su ley día y noche.',
        'Será como un árbol plantado al borde de la acequia: da fruto a su tiempo y no se marchitan sus hojas; y con todo lo que emprende tiene éxito.',
        'Porque el Señor protege el camino de los justos, pero el camino de los impíos acaba mal.'
      ]
    },
    gospel: {
      citation: 'Mateo 5:1-12a',
      acclamation: 'Aleluya. Alegraos y regocijaos, porque vuestra recompensa será grande en los cielos. Aleluya.',
      text: 'En aquel tiempo, al ver Jesús el gentío, subió a la montaña, se sentó y se acercaron sus discípulos; y abriendo su boca les enseñaba diciendo: «Bienaventurados los pobres en el espíritu, porque de ellos es el reino de los cielos. Bienaventurados los mansos, porque ellos heredarán la tierra. Bienaventurados los que lloran, porque ellos serán consolados. Bienaventurados los que tienen hambre y sed de la justicia, porque ellos quedarán saciados. Bienaventurados los misericordiosos, porque ellos alcanzarán misericordia. Bienaventurados los limpios de corazón, porque ellos verán a Dios. Bienaventurados los que trabajan por la paz, porque ellos serán llamados hijos de Dios. Bienaventurados los perseguidos por causa de la justicia, porque de ellos es el reino de los cielos».'
    }
  },
  // 2: Martes
  {
    firstReading: {
      citation: 'Romanos 8:31b-39',
      text: 'Hermanos: Si Dios está con nosotros, ¿quién estará contra nosotros? El que no se reservó a su propio Hijo, sino que lo entregó por todos nosotros, ¿cómo no nos dará todo con él? ¿Quién acusará a los elegidos de Dios? Dios es el que justifica. ¿Quién condenará? ¿Acaso Cristo Jesús, que murió, más aún, resucitó y está a la derecha de Dios y que intercede por nosotros? ¿Quién nos separará del amor de Cristo? ¿La tribulación, la angustia, la persecución, el hambre, la desnudez, el peligro, la espada? En todo esto vencemos de sobra gracias a aquel que nos ha amado.'
    },
    psalm: {
      citation: 'Salmo 27:1, 4, 13-14',
      response: 'El Señor es mi luz y mi salvación.',
      verses: [
        'El Señor es mi luz y mi salvación, ¿a quién temeré? El Señor es la defensa de mi vida, ¿quién me hará temblar?',
        'Una cosa pido al Señor, eso buscaré: habitar en la casa del Señor por los días de mi vida; gozar de la dulzura del Señor, contemplando su templo.',
        'Espero gozar de la dicha del Señor en el país de la vida. Espera en el Señor, sé valiente, ten ánimo, espera en el Señor.'
      ]
    },
    gospel: {
      citation: 'Marcos 10:17-21',
      acclamation: 'Aleluya. Bendito seas, Padre, Señor de cielo y tierra, porque has revelado los secretos del Reino a los sencillos. Aleluya.',
      text: 'En aquel tiempo, cuando salía Jesús al camino, se le acercó uno corriendo, cayó de rodillas ante él y le preguntó: «Maestro bueno, ¿qué haré para heredar la vida eterna?». Jesús le contestó: «¿Por qué me llamas bueno? No hay nadie bueno más que Dios. Ya sabes los mandamientos: no matarás, no cometerás adulterio, no robarás, no darás falso testimonio, no estafarás, honra a tu padre y a tu madre». Él replicó: «Maestro, todo eso lo he cumplido desde mi juventud». Jesús se le quedó mirando con amor y le dijo: «Una cosa te falta: anda, vende lo que tienes, dale el dinero a los pobres, así tendrás un tesoro en el cielo, y luego ven y sígueme».'
    }
  },
  // 3: Miércoles
  {
    firstReading: {
      citation: '1 Juan 4:7-12',
      text: 'Queridos hermanos: Amémonos unos a otros, ya que el amor es de Dios, y todo el que ama ha nacido de Dios y conoce a Dios. Quien no ama no ha conocido a Dios, porque Dios es amor. En esto se manifestó el amor que Dios nos tiene: en que Dios envió al mundo a su Unigénito, para que vivamos por medio de él. En esto consiste el amor: no en que nosotros hayamos amado a Dios, sino en que él nos amó y nos envió a su Hijo como víctima de propiciación por nuestros pecados. Queridos hermanos, si Dios nos amó de esta manera, también nosotros debemos amarnos unos a otros.'
    },
    psalm: {
      citation: 'Salmo 103:1-2, 3-4, 8 y 10',
      response: 'El Señor es compasivo y misericordioso.',
      verses: [
        'Bendice, alma mía, al Señor, y todo mi ser a su santo nombre. Bendice, alma mía, al Señor, y no olvides sus beneficios.',
        'Él perdona todas tus culpas y cura todas tus enfermedades; él rescata tu vida de la fosa y te colma de gracia y de ternura.',
        'El Señor es compasivo y misericordioso, lento a la ira y rico en clemencia; no nos trata como merecen nuestros pecados ni nos paga según nuestras culpas.'
      ]
    },
    gospel: {
      citation: 'Lucas 10:25-37',
      acclamation: 'Aleluya. Os doy un mandamiento nuevo: que os améis unos a otros como yo os he amado. Aleluya.',
      text: 'En aquel tiempo, se levantó un maestro de la ley y preguntó a Jesús para ponerlo a prueba: «Maestro, ¿qué tengo que hacer para heredar la vida eterna?». Él le dijo: «¿Qué está escrito en la ley? ¿Cómo lees tú?». Él respondió: «Amarás al Señor, tu Dios, con todo tu corazón y con toda tu alma y con toda tu fuerza y con toda tu mente. Y a tu prójimo como a ti mismo». Jesús le dijo: «Has respondido bien; haz esto y tendrás vida». Pero él, queriendo justificar su pregunta, dijo a Jesús: «¿Y quién es mi prójimo?». Jesús le relató la parábola del buen samaritano que, viendo al hombre herido al borde del camino, se compadeció, vendó sus heridas derramando aceite y vino, lo llevó a la posada y cuidó de él.'
    }
  },
  // 4: Jueves
  {
    firstReading: {
      citation: '1 Corintios 11:23-26',
      text: 'Hermanos: Yo he recibido una tradición, que procede del Señor y que a mi vez os he transmitido: Que el Señor Jesús, en la noche en que iba a ser entregado, tomó pan y, pronunciando la acción de gracias, lo partió y dijo: «Esto es mi cuerpo, que se entrega por vosotros. Haced esto en memoria mía». Lo mismo hizo con el cáliz, después de cenar, diciendo: «Este cáliz es la nueva alianza en mi sangre. Haced esto cuantas veces lo bebiereis, en memoria mía». Así pues, cada vez que coméis de este pan y bebéis del cáliz, proclamáis la muerte del Señor, hasta que vuelva.'
    },
    psalm: {
      citation: 'Salmo 116:12-13, 15-16bc, 17-18',
      response: 'El cáliz de la bendición es comunión con la sangre de Cristo.',
      verses: [
        '¿Cómo pagaré al Señor todo el bien que me ha hecho? Alzaré la copa de la salvación, invocando el nombre del Señor.',
        'Mucho le cuesta al Señor la muerte de sus fieles. Señor, yo soy tu siervo, siervo tuyo, hijo de tu esclava: rompiste mis cadenas.',
        'Te ofreceré un sacrificio de alabanza, invocando el nombre del Señor. Cumpliré mis votos al Señor en presencia de todo su pueblo.'
      ]
    },
    gospel: {
      citation: 'Juan 6:51-58',
      acclamation: 'Aleluya. Yo soy el pan vivo que ha bajado del cielo, dice el Señor; quien coma de este pan vivirá para siempre. Aleluya.',
      text: 'En aquel tiempo, dijo Jesús a los judíos: «Yo soy el pan vivo que ha bajado del cielo; el que coma de este pan vivirá para siempre. Y el pan que yo daré es mi carne para la vida del mundo». Disputaban los judíos entre sí: «¿Cómo puede este darnos a comer su carne?». Entonces Jesús les dijo: «En verdad, en verdad os digo: si no coméis la carne del Hijo del hombre y no bebéis su sangre, no tenéis vida en vosotros. El que come mi carne y bebe mi sangre tiene vida eterna, y yo lo resucitaré en el último día. Mi carne es verdadera comida y mi sangre es verdadera bebida. El que come mi carne y bebe mi sangre habita en mí y yo en él».'
    }
  },
  // 5: Viernes
  {
    firstReading: {
      citation: 'Filipenses 2:5-11',
      text: 'Hermanos: Tened entre vosotros los mismos sentimientos que tuvo Cristo Jesús, el cual, siendo de condición divina, no retuvo ávidamente el ser igual a Dios; al contrario, se despojó de sí mismo tomando la condición de esclavo, hecho semejante a los hombres. Y así, actuando como un hombre cualquiera, se rebajó hasta someterse incluso a la muerte, y una muerte de cruz. Por eso Dios lo exaltó sobre todo y le concedió el Nombre-sobre-todo-nombre; de modo que al nombre de Jesús toda rodilla se doble en el cielo, en la tierra, en el abismo, y toda lengua proclame: Jesucristo es Señor, para gloria de Dios Padre.'
    },
    psalm: {
      citation: 'Salmo 22:8-9, 17-18a, 19-20, 23-24',
      response: 'Dios mío, Dios mío, ¿por qué me has abandonado?',
      verses: [
        'Al verme, se burlan de mí, hacen visajes, menean la cabeza: «Acudió al Señor, que lo ponga a salvo; que lo libre, si tanto lo quiere».',
        'Me acorrala una jauría de mastines, me cerca una banda de malhechores; me taladran las manos y los pies, puedo contar todos mis huesos.',
        'Se reparten mi ropa, echan a suertes mi túnica. Pero tú, Señor, no te quedes lejos; fuerza mía, ven corriendo a socorrerme.'
      ]
    },
    gospel: {
      citation: 'Juan 15:9-17',
      acclamation: 'Aleluya. Vosotros sois mis amigos si hacéis lo que yo os mando, dice el Señor. Aleluya.',
      text: 'En aquel tiempo, dijo Jesús a sus discípulos: «Como el Padre me ha amado, así os he amado yo; permaneced en mi amor. Si guardáis mis mandamientos, permaneceréis en mi amor; lo mismo que yo he guardado los mandamientos de mi Padre y permanezco en su amor. Os he hablado de esto para que mi alegría esté en vosotros, y vuestra alegría llegue a plenitud. Este es mi mandamiento: que os améis unos a otros como yo os he amado. Nadie tiene amor más grande que el que da la vida por sus amigos. Vosotros sois mis amigos si hacéis lo que yo os mando».'
    }
  },
  // 6: Sábado
  {
    firstReading: {
      citation: 'Colosenses 3:12-17',
      text: 'Hermanos: Como elegidos de Dios, santos y amados, revestíos de compasión entrañable, bondad, humildad, mansedumbre, paciencia. Sobrellevaos mutuamente y perdonaos, cuando alguno tenga quejas contra otro. El Señor os perdonó: haced vosotros lo mismo. Y por encima de todo esto, revestíos del amor, que es el vínculo de la perfección. Que la paz de Cristo reine en vuestros corazones: a ella habéis sido convocados en un solo cuerpo. Y sed agradecidos. La palabra de Cristo habite entre vosotros en toda su riqueza.'
    },
    psalm: {
      citation: 'Salmo 34:2-3, 4-5, 6-7, 8-9',
      response: 'Gustad y ved qué bueno es el Señor.',
      verses: [
        'Bendigo al Señor en todo momento, su alabanza está siempre en mi boca; mi alma se gloría en el Señor: que los humildes lo escuchen y se alegren.',
        'Proclamad conmigo la grandeza del Señor, ensalcemos juntos su nombre. Yo consulté al Señor, y me respondió, me libró de todas mis ansias.',
        'Contempladlo, y quedaréis radiantes, vuestro rostro no se avergonzará. Si el afligido invoca al Señor, él lo escucha y lo salva de sus angustias.',
        'El ángel del Señor acampa en torno a sus fieles y los protege. Gustad y ved qué bueno es el Señor, dichoso el que se acoge a él.'
      ]
    },
    gospel: {
      citation: 'Lucas 1:46-55',
      acclamation: 'Aleluya. Dichosa tú, Virgen María, que creíste, porque lo que te ha dicho el Señor se cumplirá. Aleluya.',
      text: 'En aquel tiempo, María dijo: «Proclama mi alma la grandeza del Señor, se alegra mi espíritu en Dios, mi salvador; porque ha mirado la humildad de su esclava. Desde ahora me felicitarán todas las generaciones, porque el Poderoso ha hecho obras grandes en mí: su nombre es santo, y su misericordia llega a sus fieles de generación en generación. Él hace proezas con su brazo: dispersa a los soberbios de corazón, derriba del trono a los poderosos y enaltece a los humildes, a los hambrientos los colma de bienes y a los ricos los despide vacíos. Auxilia a Israel, su siervo, acordándose de la misericordia —como lo había prometido a nuestros padres— en favor de Abrahán y su descendencia por siempre».'
    }
  }
];

// Memory cache for runtime dynamic liturgy
const clientLiturgyMemoryCache = new Map<string, LiturgicalDay>();
const LITURGY_STORAGE_PREFIX = 'panvivo_liturgy_v5_';
const LEGACY_LITURGY_STORAGE_PREFIX = 'panvivo_liturgy_v3_';

function mergeWithCurated(dateStr: string, official: LiturgicalDay): LiturgicalDay {
  const curated = LITURGY_DATABASE[dateStr];
  if (!curated) return official;
  return { ...official, defaultReflection: curated.defaultReflection };
}

function isOfficial(day: LiturgicalDay | null | undefined): boolean {
  return !!day && day.source === 'evangelizo' && !day.readingsPending
    && !!day.firstReading?.text?.trim() && !!day.firstReading?.citation?.trim()
    && !!day.gospel?.text?.trim() && !!day.gospel?.citation?.trim();
}

/** Synchronous best-effort day (used for the first paint before the official readings arrive). */
export function getLiturgicalDay(dateStr: string): LiturgicalDay {
  const cached = clientLiturgyMemoryCache.get(dateStr);
  if (cached) return cached;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LITURGY_STORAGE_PREFIX + dateStr)
        || localStorage.getItem('panvivo_liturgy_v4_' + dateStr)
        || localStorage.getItem(LEGACY_LITURGY_STORAGE_PREFIX + dateStr);
      if (stored) {
        const parsed = JSON.parse(stored) as LiturgicalDay;
        if (isOfficial(parsed) && parsed.date === dateStr) {
          if (!parsed.saintVerification || parsed.saintVerification.date !== dateStr) {
            const confirmed = confirmedPrintSaint(dateStr);
            parsed.saint = confirmed?.saint || pendingSaint();
            parsed.saintVerification = confirmed?.saintVerification;
            const info = getLiturgicalCalendarInfo(dateStr);
            const { color } = resolveLiturgicalColor(info, parsed.title, confirmed?.saint.color);
            parsed.color = color;
            parsed.colorName = getColorName(color, color !== info.color
              ? `Memoria de ${parsed.saint.name}` : info.season);
          }
          clientLiturgyMemoryCache.set(dateStr, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  return buildCanonicalDay(dateStr);
}

/**
 * Fetches the official liturgy of any date: memory/localStorage cache -> server API ->
 * Evangelizo directly -> local calendar with an explicit notice, never abridged readings.
 */
export async function fetchLiturgicalDay(dateStr: string): Promise<LiturgicalDay> {
  const cached = getLiturgicalDay(dateStr);
  if (isOfficial(cached) && hasFreshSaintVerification(cached.saintVerification, dateStr)) return cached;

  const remember = (day: LiturgicalDay) => {
    clientLiturgyMemoryCache.set(dateStr, day);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LITURGY_STORAGE_PREFIX + dateStr, JSON.stringify(day));
      } catch {
        // Ignore quota errors
      }
    }
    return day;
  };

  try {
    const res = await fetch(`/api/liturgy?date=${encodeURIComponent(dateStr)}`);
    if (res.ok) {
      const data = (await res.json()) as LiturgicalDay;
      if (data.date === dateStr && data.saintVerification) {
        if (isOfficial(data)) return remember(data);
        if (isOfficial(cached)) return remember({
          ...cached, saint: data.saint, saintVerification: data.saintVerification,
        });
        if (data.readingsPending) return remember(data);
      }
    }
  } catch {
    // Try the official source directly
  }

  if (isOfficial(cached)) return cached;
  const direct = await fetchEvangelizoDay(dateStr);
  if (direct) return remember(mergeWithCurated(dateStr, direct));

  return buildCanonicalDay(dateStr);
}
