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
    title: 'XXIV Domingo del Tiempo Ordinario',
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario',
    saint: {
      name: 'San Juan Crisóstomo',
      title: 'Obispo y Doctor de la Iglesia',
      shortBio: 'Patriarca de Constantinopla apodado "Boca de Oro" por su elocuencia divina. Defendió con caridad intrépida a los pobres y la ortodoxia de la fe.',
      fullBio: 'Uno de los cuatro grandes doctores de la Iglesia de Oriente. Nació en Antioquía hacia el año 347. Maestro insigne de la predicación bíblica, reformó el clero y las costumbres de la corte imperial. Desterrado dos veces por defender la verdad, murió en el exilio exclamando: "¡Gloria a Dios por todo!". Es patrono universal de los predicadores católicos.',
      patronage: 'Predicadores, oradores, Constantinopla',
      prayer: 'Dios nuestro, fortaleza de los que esperan en ti, que hiciste resplandecer a San Juan Crisóstomo por su admirable elocuencia y su fortaleza en el sufrimiento, concédenos aprender de sus enseñanzas y ser sostenidos por el ejemplo de su paciencia. Por Jesucristo nuestro Señor. Amén.'
    },
    firstReading: {
      citation: 'Isaías 50:5-9a',
      text: 'El Señor Dios me abrió el oído; yo no me rebelé ni me eché atrás. Ofrecí mi espalda a los que me golpeaban, mis mejillas a los que me mesaban la barba; no oculté mi rostro a insultos y salivazos. El Señor Dios me ayuda, por eso no sentía los ultrajes; por eso endurecí mi rostro como pedernal, sabiendo que no quedaría defraudado.'
    },
    psalm: {
      citation: 'Salmo 116:1-2, 3-4, 5-6, 8-9',
      response: 'Caminaré en presencia del Señor en el país de la vida.',
      verses: [
        'Amo al Señor, porque escucha mi voz suplicante, porque inclina su oído hacia mí el día que lo invoco.',
        'Me envolvían redes de muerte, caí en tristeza y angustia. Invoqué el nombre del Señor: «Señor, salva mi vida».',
        'El Señor es benigno y justo, nuestro Dios es compasivo. El Señor guarda a los sencillos: estando yo sin fuerzas me salvó.'
      ]
    },
    secondReading: {
      citation: 'Santiago 2:14-18',
      text: '¿De qué le sirve a uno, hermanos míos, decir que tiene fe, si no tiene obras? ¿Podrá acaso salvarlo esa fe? Si un hermano o una hermana andan desnudos y faltos del alimento diario y uno de vosotros les dice: «Id en paz, abrigaos y saciaos», pero no les da lo necesario para el cuerpo, ¿de qué sirve? Así es también la fe: si no tiene obras, está muerta en sí misma.'
    },
    gospel: {
      citation: 'Marcos 8:27-35',
      acclamation: 'Aleluya, aleluya. Dios no quiera que yo me gloríe sino en la cruz de nuestro Señor Jesucristo, por quien el mundo está crucificado para mí, y yo para el mundo. Aleluya.',
      text: 'En aquel tiempo, Jesús y sus discípulos salieron hacia las aldeas de Cesarea de Filipo, y por el camino preguntó a sus discípulos: «¿Quién dice la gente que soy yo?». Ellos le contestaron: «Unos, Juan el Bautista; otros, Elías; y otros, uno de los profetas». Entonces él les preguntó: «Y vosotros, ¿quién decís que soy yo?». Tomando la palabra Pedro, le dijo: «Tú eres el Mesías». Y les conminó a que no dijeran nada a nadie de él. Y empezó a instruirlos: «El Hijo del hombre tiene que padecer mucho, ser reprobado por los ancianos, sumos sacerdotes y escribas, ser ejecutado y resucitar a los tres días». Con toda claridad les decía esto... Entonces llamó a la gente y a sus discípulos y les dijo: «Si alguno quiere venir en pos de mí, que se niegue a sí mismo, tome su cruz y me siga. Porque quien quiera salvar su vida, la perderá; pero el que pierda su vida por mí y por el Evangelio, la salvará».'
    }
  }
};

export function getLiturgicalDay(dateStr: string): LiturgicalDay {
  if (LITURGY_DATABASE[dateStr]) {
    return LITURGY_DATABASE[dateStr];
  }

  // Generate dynamic liturgical day for any given date
  const dateObj = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
  const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });
  const dayNum = dateObj.getDate();

  return {
    date: dateStr,
    formattedDate: `${dayOfWeek}, ${monthName} ${dayNum}`,
    title: `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} del Tiempo Ordinario`,
    season: 'Tiempo Ordinario',
    color: 'green',
    colorName: 'Tiempo Ordinario',
    saint: {
      name: 'Santos y Beatos del Día',
      title: 'Testigos del Reino de Dios',
      shortBio: 'La Iglesia conmemora hoy a los santos confesores, mártires y almas consagradas que ofrecieron su vida entera al servicio del Evangelio y la caridad cristiana.',
      fullBio: 'A lo largo de los siglos, una multitud inmensa de testigos nos precede en la fe. Su intercesión constante ante el trono del Cordero nos acompaña en nuestras pruebas cotidianas.',
      prayer: 'Dios todopoderoso y eterno, que nos concedes celebrar la memoria de tus santos, concédenos por su intercesión el aumento continuo de tu gracia y la santidad de vida. Amén.'
    },
    firstReading: {
      citation: '1 Corintios 12:12-31',
      text: 'Hermanos: Así como el cuerpo es uno y tiene muchos miembros, y todos los miembros del cuerpo, siendo muchos, son un solo cuerpo, así también Cristo. Porque en un solo Espíritu hemos sido todos bautizados para formar un solo cuerpo, ya seamos judíos o griegos, esclavos o libres. Procurad con ardor los dones más altos; y aún os voy a mostrar un camino más excelente todavía: el camino de la caridad.'
    },
    psalm: {
      citation: 'Salmo 100:1b-2, 3, 4, 5',
      response: 'Somos su pueblo y ovejas de su rebaño.',
      verses: [
        'Aclama al Señor, tierra entera, servid al Señor con alegría, entrad en su presencia con vítores.',
        'Sabed que el Señor es Dios: que él nos hizo y somos suyos, su pueblo y ovejas de su rebaño.',
        'Entrad por sus puertas con acción de gracias, por sus atrios con himnos, dándole gracias y bendiciendo su nombre.'
      ]
    },
    gospel: {
      citation: 'Lucas 7:11-17',
      acclamation: 'Aleluya. Un gran profeta ha surgido entre nosotros: Dios ha visitado a su pueblo. Aleluya.',
      text: 'En aquel tiempo, iba Jesús camino de una ciudad llamada Naín, y marchaban con él sus discípulos y una gran muchedumbre. Cuando se acercaba a la puerta de la ciudad, sacaban a enterrar a un muerto, hijo único de su madre, que era viuda... Al verla, el Señor tuvo compasión de ella y le dijo: «No llores». Se acercó y tocó el féretro. Los que lo llevaban se detuvieron; y él dijo: «Muchacho, a ti te digo, levántate». El muerto se incorporó y empezó a hablar, y Jesús se lo entregó a su madre. Todos sobrecogidos daban gloria a Dios.'
    }
  };
}
