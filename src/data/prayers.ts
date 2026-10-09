import { getTodayDateStr, parseDateStr } from '../lib/dateUtils.ts';

export interface MysteryItem {
  id: number;
  numberTitle: string; // "Primer Misterio"
  name: string; // "La Oración de Jesús en el Huerto"
  scriptureRef: string; // "Lc 22, 39-46"
  scriptureText: string;
  fruit: string; // "Contrición sincera de los pecados"
  meditation: string;
  image: string;
}

export interface RosaryMysteryGroup {
  id: 'gozosos' | 'dolorosos' | 'gloriosos' | 'luminosos';
  title: string;
  days: string;
  description: string;
  image: string;
  mysteries: MysteryItem[];
}

export const ROSARY_GROUPS: RosaryMysteryGroup[] = [
  {
    id: 'dolorosos',
    title: 'Misterios Dolorosos',
    days: 'Martes y Viernes',
    description: 'Acompañamos a Nuestro Señor en su Pasión y Muerte redentora.',
    image: 'https://images.unsplash.com/photo-1544830208-87a32bb58409?auto=format&fit=crop&w=600&q=80',
    mysteries: [
      {
        id: 1,
        numberTitle: 'Primer Misterio Doloroso',
        name: 'La Agonía de Jesús en el Huerto de Getsemaní',
        scriptureRef: 'Lucas 22:39-44',
        scriptureText: '«Y sumido en agonía, oraba más intensamente; y su sudor se convirtió en gotas de sangre que caían en tierra».',
        fruit: 'Dolor y contrición sincera de los pecados.',
        meditation: 'Jesús contempla el peso del pecado de la humanidad y acepta la voluntad del Padre. Pidamos la gracia de orar en los momentos de angustia y abandono.',
        image: 'https://images.unsplash.com/photo-1548625361-195fe5795df5?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 2,
        numberTitle: 'Segundo Misterio Doloroso',
        name: 'La Flagelación de Nuestro Señor Jesucristo',
        scriptureRef: 'Juan 19:1',
        scriptureText: '«Entonces Pilato tomó a Jesús y mandó que lo azotaran».',
        fruit: 'Mortificación de las pasiones y pureza de cuerpo y alma.',
        meditation: 'Jesús calla y ofrece sus dolores por nuestra sanación. Que aprendamos a abrazar los sacrificios diarios con paciencia.',
        image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 3,
        numberTitle: 'Tercer Misterio Doloroso',
        name: 'La Coronación de Espinas',
        scriptureRef: 'Mateo 27:28-29',
        scriptureText: '«Y trenzando una corona de espinas, se la pusieron sobre su cabeza, y una caña en su mano derecha; e hincando la rodilla delante de él, se burlaban diciendo: ¡Salve, Rey de los judíos!».',
        fruit: 'Humildad sincera y victoria sobre el respeto humano.',
        meditation: 'El Rey de la gloria es coronado con dolor e ignominia. Pidamos no avergonzarnos jamás de confesar nuestra fe ante el mundo.',
        image: 'https://images.unsplash.com/photo-1544830208-87a32bb58409?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 4,
        numberTitle: 'Cuarto Misterio Doloroso',
        name: 'Jesús con la Cruz a Cuestas camino al Calvario',
        scriptureRef: 'Lucas 23:26-27',
        scriptureText: '«Tomaron a un tal Simón de Cirene, que venía del campo, y le cargaron la cruz para que la llevase detrás de Jesús».',
        fruit: 'Paciencia heroica en el sufrimiento y auxilio al prójimo.',
        meditation: 'Jesús abraza su Cruz por amor a nosotros. Pidamos la docilidad del Cireneo para ayudar a cargar la cruz de nuestros hermanos.',
        image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 5,
        numberTitle: 'Quinto Misterio Doloroso',
        name: 'La Crucifixión y Muerte de Nuestro Señor Jesucristo',
        scriptureRef: 'Juan 19:28-30',
        scriptureText: '«Jesús dijo: "Todo está cumplido". E inclinando la cabeza, entregó el espíritu».',
        fruit: 'Amor supremo a Dios, perdón a los enemigos y perseverancia final.',
        meditation: 'Desde lo alto de la Cruz Jesús nos entrega a María como Madre: "Hijo, he ahí a tu madre". Confiémonos a su amparo maternal.',
        image: 'https://images.unsplash.com/photo-1520697830682-bbb6e85e2b0b?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    id: 'gozosos',
    title: 'Misterios Gozosos',
    days: 'Lunes y Sábado',
    description: 'La Encarnación e infancia de Nuestro Señor Jesucristo.',
    image: 'https://images.unsplash.com/photo-1514897575457-c4db467cf78e?auto=format&fit=crop&w=600&q=80',
    mysteries: [
      {
        id: 1,
        numberTitle: 'Primer Misterio Gozoso',
        name: 'La Anunciación del Ángel a María Santísima',
        scriptureRef: 'Lucas 1:26-38',
        scriptureText: '«Dijo María: He aquí la esclava del Señor; hágase en mí según tu palabra».',
        fruit: 'Humildad y obediencia a la voluntad de Dios.',
        meditation: 'El "Sí" humilde de la Virgen María abrió las puertas a la salvación. Pidamos docilidad al Espíritu Santo.',
        image: 'https://images.unsplash.com/photo-1514897575457-c4db467cf78e?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 2,
        numberTitle: 'Segundo Misterio Gozoso',
        name: 'La Visitación de Nuestra Señora a su prima Santa Isabel',
        scriptureRef: 'Lucas 1:39-45',
        scriptureText: '«¿Quién soy yo para que la madre de mi Señor venga a visitarme?».',
        fruit: 'Caridad servicial y prontitud hacia el prójimo.',
        meditation: 'María viaja con prontitud para servir. Pidamos un corazón atento a las necesidades de quienes nos rodean.',
        image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 3,
        numberTitle: 'Tercer Misterio Gozoso',
        name: 'El Nacimiento del Hijo de Dios en el portal de Belén',
        scriptureRef: 'Lucas 2:6-14',
        scriptureText: '«Y dio a luz a su hijo primogénito, y lo envolvió en pañales y lo acostó en un pesebre».',
        fruit: 'Pobreza de espíritu y desapego de los bienes terrenales.',
        meditation: 'Dios omnipotente se hace niño indefenso en la pobreza. Que sepamos encontrar a Cristo en los sencillos.',
        image: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 4,
        numberTitle: 'Cuarto Misterio Gozoso',
        name: 'La Presentación del Niño Jesús en el Templo',
        scriptureRef: 'Lucas 2:22-35',
        scriptureText: '«Luz para alumbrar a las naciones y gloria de tu pueblo Israel».',
        fruit: 'Pureza de mente y corazón, y respeto a las cosas santas.',
        meditation: 'María y José consagran al Niño en fidelidad a la Ley. Consagremos nuestras vidas y familias al Señor.',
        image: 'https://images.unsplash.com/photo-1548625361-195fe5795df5?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 5,
        numberTitle: 'Quinto Misterio Gozoso',
        name: 'El Niño Jesús perdido y hallado en el Templo',
        scriptureRef: 'Lucas 2:46-51',
        scriptureText: '«¿No sabíais que debía ocuparme en las cosas de mi Padre?».',
        fruit: 'Búsqueda incansable de Jesús en la vida cotidiana.',
        meditation: 'Tras tres días de dolor, lo hallaron en el Templo. Cuando nos sintamos alejados de Dios, busquémosle en la Eucaristía.',
        image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    id: 'gloriosos',
    title: 'Misterios Gloriosos',
    days: 'Miércoles y Domingo',
    description: 'La Pascua del Señor, la venida del Espíritu Santo y la gloria de María.',
    image: 'https://images.unsplash.com/photo-1520697830682-bbb6e85e2b0b?auto=format&fit=crop&w=600&q=80',
    mysteries: [
      {
        id: 1,
        numberTitle: 'Primer Misterio Glorioso',
        name: 'La Resurrección triunfante de Nuestro Señor Jesucristo',
        scriptureRef: 'Mateo 28:5-6',
        scriptureText: '«No temáis vosotras; sé que buscáis a Jesús, el crucificado. No está aquí: ¡ha resucitado!».',
        fruit: 'Fe viva y renovación interior en Cristo.',
        meditation: 'La muerte ha sido vencida para siempre. Vivamos con la certeza de que nada puede apartarnos del amor de Dios.',
        image: 'https://images.unsplash.com/photo-1520697830682-bbb6e85e2b0b?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 2,
        numberTitle: 'Segundo Misterio Glorioso',
        name: 'La Admirable Ascensión del Señor al Cielo',
        scriptureRef: 'Hechos 1:9-11',
        scriptureText: '«Fue elevado a la vista de ellos, y una nube lo ocultó a sus ojos».',
        fruit: 'Esperanza firme del cielo y anhelo de las cosas celestiales.',
        meditation: 'Jesús asciende para preparar un lugar para nosotros. Mantengamos nuestra mirada y esperanza en la eternidad.',
        image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 3,
        numberTitle: 'Tercer Misterio Glorioso',
        name: 'La Venida del Espíritu Santo en Pentecostés',
        scriptureRef: 'Hechos 2:1-4',
        scriptureText: '«Se llenaron todos del Espíritu Santo y comenzaron a hablar en lenguas extrañas».',
        fruit: 'Celo apostólico, sabiduría y dones del Espíritu Santo.',
        meditation: 'El Espíritu prometido enciende el corazón de los discípulos. Pidamos el fuego de su amor para ser valientes apóstoles.',
        image: 'https://images.unsplash.com/photo-1548625361-195fe5795df5?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 4,
        numberTitle: 'Cuarto Misterio Glorioso',
        name: 'La Asunción de la Santísima Virgen en cuerpo y alma al Cielo',
        scriptureRef: 'Apocalipsis 12:1',
        scriptureText: '«Una gran señal apareció en el cielo: una Mujer vestida del sol, con la luna bajo sus pies».',
        fruit: 'Deseo ardiente de la santidad y devoción filial a la Virgen.',
        meditation: 'María entra en la gloria divina como primicia de la redención. Ella vela maternalmente por cada uno de sus hijos.',
        image: 'https://images.unsplash.com/photo-1514897575457-c4db467cf78e?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 5,
        numberTitle: 'Quinto Misterio Glorioso',
        name: 'La Coronación de María como Reina de todo lo creado',
        scriptureRef: 'Judit 15:9',
        scriptureText: '«Tú eres la gloria de Jerusalén, tú la alegría de Israel, tú el honor de nuestro pueblo».',
        fruit: 'Confianza invencible en la poderosa intercesión de la Virgen.',
        meditation: 'Reina de los ángeles, refugio de los pecadores. Coronémosla hoy con cada una de nuestras oraciones.',
        image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    id: 'luminosos',
    title: 'Misterios Luminosos',
    days: 'Jueves',
    description: 'La vida pública y las manifestaciones luminosas de Cristo.',
    image: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=600&q=80',
    mysteries: [
      {
        id: 1,
        numberTitle: 'Primer Misterio Luminoso',
        name: 'El Bautismo de Jesús en el Río Jordán',
        scriptureRef: 'Mateo 3:16-17',
        scriptureText: '«Este es mi Hijo amado, en quien me complazco».',
        fruit: 'Fidelidad al Bautismo y docilidad a la gracia divina.',
        meditation: 'El inocente se sumerge en las aguas para purificarlas. Agradezcamos el inmenso don de ser hijos de Dios.',
        image: 'https://images.unsplash.com/photo-1548625361-195fe5795df5?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 2,
        numberTitle: 'Segundo Misterio Luminoso',
        name: 'La Autorrevelación en las Bodas de Caná',
        scriptureRef: 'Juan 2:5',
        scriptureText: '«Dijo su madre a los sirvientes: Haced lo que él os diga».',
        fruit: 'Confianza y obediencia absoluta a la palabra de Jesús.',
        meditation: 'Por la intercesión de su Madre, Jesús obra su primer milagro. Entreguemos a María todas nuestras necesidades.',
        image: 'https://images.unsplash.com/photo-1514897575457-c4db467cf78e?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 3,
        numberTitle: 'Tercer Misterio Luminoso',
        name: 'El Anuncio del Reino de Dios invitando a la conversión',
        scriptureRef: 'Marcos 1:15',
        scriptureText: '«El tiempo se ha cumplido y el Reino de Dios está cerca; convertíos y creed en el Evangelio».',
        fruit: 'Verdadera conversión del corazón y sed de reconciliación.',
        meditation: 'Jesús proclama el perdón y la misericordia infinita del Padre. Acerquémonos con frecuencia al sacramento de la confesión.',
        image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 4,
        numberTitle: 'Cuarto Misterio Luminoso',
        name: 'La Transfiguración del Señor en el Monte Tabor',
        scriptureRef: 'Lucas 9:29',
        scriptureText: '«Mientras oraba, el aspecto de su rostro cambió y sus vestidos brillaban de blancor».',
        fruit: 'Espíritu de contemplación y perseverancia en la oración.',
        meditation: 'Jesús revela su gloria a los discípulos para fortalecerlos en la prueba de la Cruz. Busquemos momentos de silencio con el Señor.',
        image: 'https://images.unsplash.com/photo-1520697830682-bbb6e85e2b0b?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 5,
        numberTitle: 'Quinto Misterio Luminoso',
        name: 'La Institución de la Sagrada Eucaristía en la Última Cena',
        scriptureRef: 'Lucas 22:19',
        scriptureText: '«Esto es mi cuerpo, que es entregado por vosotros; haced esto en memoria mía».',
        fruit: 'Amor fervoroso a la Santa Misa y adoración al Santísimo Sacramento.',
        meditation: 'Cristo se queda vivo y real con nosotros hasta el fin de los tiempos en el Pan de Vida. Que sea el centro de nuestros días.',
        image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80'
      }
    ]
  }
];

export function getTodayMysteries(): RosaryMysteryGroup {
  const day = parseDateStr(getTodayDateStr()).getDay();
  if (day === 1 || day === 6) return ROSARY_GROUPS.find(g => g.id === 'gozosos')!;
  if (day === 2 || day === 5) return ROSARY_GROUPS.find(g => g.id === 'dolorosos')!;
  if (day === 4) return ROSARY_GROUPS.find(g => g.id === 'luminosos')!;
  return ROSARY_GROUPS.find(g => g.id === 'gloriosos')!;
}

// Oraciones Tradicionales
export const COMMON_PRAYERS = {
  signumCrucis: 'En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.',
  credo: 'Creo en Dios, Padre Todopoderoso, Creador del cielo y de la tierra. Creo en Jesucristo, su único Hijo, Nuestro Señor, que fue concebido por obra y gracia del Espíritu Santo, nació de Santa María Virgen, padeció bajo el poder de Poncio Pilato, fue crucificado, muerto y sepultado, descendió a los infiernos, al tercer día resucitó de entre los muertos, subió a los cielos y está sentado a la derecha de Dios Padre Todopoderoso. Desde allí ha de venir a juzgar a vivos y muertos. Creo en el Espíritu Santo, la santa Iglesia católica, la comunión de los santos, el perdón de los pecados, la resurrección de la carne y la vida eterna. Amén.',
  paterNoster: 'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu Reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Amén.',
  aveMaria: 'Dios te salve, María, llena eres de gracia; el Señor es contigo. Bendita tú eres entre todas las mujeres, y bendito es el fruto de tu vientre, Jesús. Santa María, Madre de Dios, ruega por nosotros, pecadores, ahora y en la hora de nuestra muerte. Amén.',
  gloria: 'Gloria al Padre, y al Hijo, y al Espíritu Santo. Como era en el principio, ahora y siempre, por los siglos de los siglos. Amén.',
  jaculatoriaFatima: 'Oh Jesús mío, perdona nuestros pecados, líbranos del fuego del infierno, lleva al cielo a todas las almas, especialmente a las más necesitadas de tu infinita misericordia.',
  salveRegina: 'Dios te salve, Reina y Madre de misericordia, vida, dulzura y esperanza nuestra; Dios te salve. A ti llamamos los desterrados hijos de Eva; a ti suspiramos, gimiendo y llorando en este valle de lágrimas. Ea, pues, Señora, abogada nuestra, vuelve a nosotros esos tus ojos misericordiosos; y después de este destierro muéstranos a Jesús, fruto bendito de tu vientre. ¡Oh clementísima, oh piadosa, oh dulce Virgen María! Ruega por nosotros, Santa Madre de Dios, para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo. Amén.',
  sanMiguel: 'San Miguel Arcángel, defiéndenos en la lucha. Sé nuestro amparo contra la perversidad y acechanzas del demonio. Que Dios manifieste sobre él su poder, es nuestra humilde súplica. Y tú, ¡oh Príncipe de la Milicia Celestial!, con el poder que Dios te ha conferido, arroja al infierno a Satanás y a los demás espíritus malignos que vagan por el mundo para la perdición de las almas. Amén.',
  angelus: [
    { v: 'El Ángel del Señor anunció a María.', r: 'Y concibió por obra del Espíritu Santo. (Avemaría)' },
    { v: 'He aquí la esclava del Señor.', r: 'Hágase en mí según tu palabra. (Avemaría)' },
    { v: 'Y el Verbo se hizo carne.', r: 'Y habitó entre nosotros. (Avemaría)' },
    { v: 'Ruega por nosotros, Santa Madre de Dios.', r: 'Para que seamos dignos de alcanzar las promesas de Nuestro Señor Jesucristo.' }
  ]
};

// Coronilla de la Divina Misericordia
export const CORONILLA_PRAYERS = {
  title: 'Coronilla de la Divina Misericordia',
  history: 'Revelada por Nuestro Señor Jesucristo a Santa Faustina Kowalska en 1935 con la promesa: «Quienquiera que la rece recibirá gran misericordia a la hora de la muerte».',
  initial: 'Padre Eterno, te ofrezco el Cuerpo y la Sangre, el Alma y la Divinidad de tu amadísimo Hijo, Nuestro Señor Jesucristo, como propiciación de nuestros pecados y los del mundo entero.',
  decena: 'Por su dolorosa Pasión, ten misericordia de nosotros y del mundo entero.',
  closing: 'Santo Dios, Santo Fuerte, Santo Inmortal, ten piedad de nosotros y del mundo entero. (Repetir 3 veces)'
};

// Letanías Lauretanas
export const LITANIES = [
  'Santa María', 'Santa Madre de Dios', 'Santa Virgen de las Vírgenes',
  'Madre de Cristo', 'Madre de la Iglesia', 'Madre de la misericordia',
  'Madre de la divina gracia', 'Madre de la esperanza', 'Madre purísima',
  'Madre castísima', 'Madre siempre virgen', 'Madre inmaculada',
  'Madre amable', 'Madre admirable', 'Madre del buen consejo',
  'Madre del Creador', 'Madre del Salvador', 'Virgen prudentísima',
  'Virgen digna de veneración', 'Virgen digna de alabanza', 'Virgen poderosa',
  'Virgen clemente', 'Virgen fiel', 'Espejo de justicia',
  'Trono de la sabiduría', 'Causa de nuestra alegría', 'Vaso espiritual',
  'Vaso digno de honor', 'Vaso insigne de devoción', 'Rosa mística',
  'Torre de David', 'Torre de marfil', 'Casa de oro',
  'Arca de la Alianza', 'Puerta del cielo', 'Estrella de la mañana',
  'Salud de los enfermos', 'Refugio de los pecadores', 'Consuelo de los migrantes',
  'Consoladora de los afligidos', 'Auxilio de los cristianos', 'Reina de los Ángeles',
  'Reina de los Patriarcas', 'Reina de los Profetas', 'Reina de los Apóstoles',
  'Reina de los Mártires', 'Reina de los Confesores', 'Reina de las Vírgenes',
  'Reina de todos los Santos', 'Reina concebida sin pecado original',
  'Reina asunta al cielo', 'Reina del Santísimo Rosario', 'Reina de la familia',
  'Reina de la paz'
];
