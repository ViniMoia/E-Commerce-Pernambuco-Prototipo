import  prisma  from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function registerUser(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    avatarImageUrl?: string;
    lojaID: string;
    address:{
        cep: string;
        state: string;
        city: string;
        district: string;
        street: string;
        number: string;
        complement?: string;
    }
} ) {
    const existingUser = await prisma.user.findUnique({
        where:{email: data.email}
    })

    if(existingUser){
        throw new Error("Email já existente")
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.name,
            password: hashedPassword,
            phone: data.phone,

            address: {
                create: {
                    ...data.address
                }
            }
        },

        include: {
            address: true
        }
    })

    const defaultAddress = user.address[0]

    await prisma.user.update({
        where: { id: user.id },
        data: {
            defaultAddressId: defaultAddress.id
        }
    })

    return user

    
}

export async function loginUser(data: {email: string, password: string}) {
    const user = await prisma.user.findUnique({
        where: { email: data.email}
    })

    if(!user){
        throw new Error("Informações erradas")
    }

    const isValid = await bcrypt.compare(data.password, user.password)

    if(!isValid){
        throw new Error("informações erradas")
    }
}
