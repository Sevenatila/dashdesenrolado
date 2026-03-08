// Script para criar usuário no banco
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
    console.log("=== Criando usuário ===\n");

    try {
        // Hash da senha
        const hashedPassword = await bcrypt.hash('123', 10);

        // Verificar se usuário já existe
        const existingUser = await prisma.user.findUnique({
            where: { email: 'atila@atila.com' }
        });

        if (existingUser) {
            console.log('Usuário já existe. Atualizando senha...');

            const updatedUser = await prisma.user.update({
                where: { email: 'atila@atila.com' },
                data: {
                    password: hashedPassword,
                    name: 'Atila'
                }
            });

            console.log('Usuário atualizado:', updatedUser.email);
        } else {
            // Criar novo usuário
            const user = await prisma.user.create({
                data: {
                    email: 'atila@atila.com',
                    password: hashedPassword,
                    name: 'Atila',
                    role: 'ADMIN'
                }
            });

            console.log('Usuário criado com sucesso!');
            console.log('Email:', user.email);
            console.log('Nome:', user.name);
            console.log('Role:', user.role);
        }

        console.log('\n✅ Login criado:');
        console.log('Email: atila@atila.com');
        console.log('Senha: 123');

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createUser();