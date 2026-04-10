require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

const users = [
  {
    name: 'Sofía Martínez',
    email: 'sofia@demo.com',
    password: '123456',
    age: 24,
    bio: 'Amante del café y los libros. Siempre buscando nueva música.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&backgroundColor=b6e3f4',
    interests: ['Música', 'Lectura', 'Viajes'],
  },
  {
    name: 'Carlos Rodríguez',
    email: 'carlos@demo.com',
    password: '123456',
    age: 27,
    bio: 'Fotógrafo aficionado. Me encanta explorar la ciudad.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos&backgroundColor=c0aede',
    interests: ['Fotografía', 'Arte', 'Tecnología'],
  },
  {
    name: 'Valentina López',
    email: 'valentina@demo.com',
    password: '123456',
    age: 22,
    bio: 'Apasionada del fitness y la cocina saludable.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Valentina&backgroundColor=ffdfbf',
    interests: ['Deportes', 'Cocina', 'Viajes'],
  },
  {
    name: 'Andrés Torres',
    email: 'andres@demo.com',
    password: '123456',
    age: 25,
    bio: 'Gamer empedernido. También me gusta el cine de ciencia ficción.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andres&backgroundColor=d1d4f9',
    interests: ['Gaming', 'Cine', 'Tecnología'],
  },
  {
    name: 'Isabella García',
    email: 'isabella@demo.com',
    password: '123456',
    age: 23,
    bio: 'Bailarina y artista. La música es mi vida.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella&backgroundColor=ffd5dc',
    interests: ['Música', 'Arte', 'Fotografía'],
  },
  {
    name: 'Diego Hernández',
    email: 'diego@demo.com',
    password: '123456',
    age: 28,
    bio: 'Viajero y aventurero. He visitado más de veinte países.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego&backgroundColor=b6e3f4',
    interests: ['Viajes', 'Fotografía', 'Deportes'],
  },
  {
    name: 'Camila Sánchez',
    email: 'camila@demo.com',
    password: '123456',
    age: 21,
    bio: 'Estudiante de diseño. Me encanta crear cosas bonitas.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camila&backgroundColor=c0aede',
    interests: ['Arte', 'Tecnología', 'Música'],
  },
  {
    name: 'Sebastián Díaz',
    email: 'sebastian@demo.com',
    password: '123456',
    age: 26,
    bio: 'Chef aficionado. Los fines de semana cocino para mis amigos.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sebastian&backgroundColor=ffdfbf',
    interests: ['Cocina', 'Viajes', 'Lectura'],
  },
  {
    name: 'Lucía Fernández',
    email: 'lucia@demo.com',
    password: '123456',
    age: 23,
    bio: 'Profesora de yoga y meditación. La calma es mi superpoder.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia&backgroundColor=ffd5dc',
    interests: ['Deportes', 'Música', 'Naturaleza'],
  },
  {
    name: 'Mateo Vargas',
    email: 'mateo@demo.com',
    password: '123456',
    age: 29,
    bio: 'Ingeniero de software. Construyo cosas por el día y toco guitarra por la noche.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mateo&backgroundColor=d1d4f9',
    interests: ['Tecnología', 'Música', 'Gaming'],
  },
  {
    name: 'Gabriela Morales',
    email: 'gabriela@demo.com',
    password: '123456',
    age: 25,
    bio: 'Escritora y amante de los viajes. Siempre con un libro en la mano.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriela&backgroundColor=b6e3f4',
    interests: ['Lectura', 'Viajes', 'Arte'],
  },
  {
    name: 'Nicolás Castro',
    email: 'nicolas@demo.com',
    password: '123456',
    age: 27,
    bio: 'Deportista y nutricionista. La salud es lo primero.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nicolas&backgroundColor=c0aede',
    interests: ['Deportes', 'Cocina', 'Fotografía'],
  },
  {
    name: 'Daniela Reyes',
    email: 'daniela@demo.com',
    password: '123456',
    age: 22,
    bio: 'Diseñadora gráfica. El arte es mi forma de ver el mundo.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniela&backgroundColor=ffdfbf',
    interests: ['Arte', 'Fotografía', 'Cine'],
  },
  {
    name: 'Felipe Ortega',
    email: 'felipe@demo.com',
    password: '123456',
    age: 30,
    bio: 'Emprendedor y amante del café. Siempre con nuevas ideas.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felipe&backgroundColor=d1d4f9',
    interests: ['Tecnología', 'Viajes', 'Lectura'],
  },
  {
    name: 'Mariana Silva',
    email: 'mariana@demo.com',
    password: '123456',
    age: 24,
    bio: 'Músico y cantante. La vida sin música no tendría sentido.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana&backgroundColor=ffd5dc',
    interests: ['Música', 'Arte', 'Viajes'],
  },
  {
    name: 'Ricardo Mendoza',
    email: 'ricardo@demo.com',
    password: '123456',
    age: 26,
    bio: 'Cinéfilo y crítico de películas. El cine es mi pasión.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo&backgroundColor=b6e3f4',
    interests: ['Cine', 'Lectura', 'Fotografía'],
  },
  {
    name: 'Paola Jiménez',
    email: 'paola@demo.com',
    password: '123456',
    age: 21,
    bio: 'Estudiante de medicina. Me encanta ayudar a los demás.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paola&backgroundColor=c0aede',
    interests: ['Deportes', 'Lectura', 'Música'],
  },
  {
    name: 'Tomás Guerrero',
    email: 'tomas@demo.com',
    password: '123456',
    age: 28,
    bio: 'Arquitecto y viajero. Diseño espacios que inspiran.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tomas&backgroundColor=ffdfbf',
    interests: ['Arte', 'Viajes', 'Fotografía'],
  },
];

const DEMO_EMAILS = users.map(u => u.email);

async function main() {
  console.log('Insertando usuarios de prueba...');

  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) {
      console.log(`Ya existe: ${u.name}`);
      continue;
    }
    await prisma.user.create({
      data: { ...u, password: await bcrypt.hash(u.password, 10) }
    });
    console.log(`Creado: ${u.name}`);
  }

  console.log('¡Usuarios listos!');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});