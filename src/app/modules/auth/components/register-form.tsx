import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

// Icons
import { Building2, FileText, Loader2, Mail, SquareUser } from "lucide-react";

// API
import { signUp } from "@/api/sign-up";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";

import { onlyDigits } from "@/lib/format";
import { getApiErrorMessage } from "@/services/api";

const signUpForm = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  role: z.enum(["REAL_ESTATE", "ADMIN"]),
  realEstateProfile: z
    .object({
      name: z.string().min(3, "O nome da imobiliária deve ter pelo menos 3 caracteres."),
      cnpj: z
        .string()
        .min(1, "Informe o CNPJ.")
        .refine(
          (val) => onlyDigits(val).length === 14,
          "CNPJ deve conter exatamente 14 dígitos.",
        ),
      phone: z.string().min(8, "Informe um telefone válido com DDD."),
      responsibleName: z.string().min(3, "O nome do responsável deve ter pelo menos 3 caracteres."),
    })
    .optional(),
});

type SignUpForm = z.infer<typeof signUpForm>;

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpForm),
    defaultValues: {
      email: "",
      password: "",
      role: "REAL_ESTATE",
      realEstateProfile: {
        name: "",
        cnpj: "",
        phone: "",
        responsibleName: "",
      },
    },
  });

  const { mutateAsync: createUser } = useMutation({
    mutationFn: signUp,
  });

  async function handleSignUp(data: SignUpForm) {
    try {
      await createUser(data);

      toast.success("Cadastro realizado com sucesso!", {
        action: {
          label: "Fazer login",
          onClick: () => navigate("/sign-in?email=" + data.email)
        }
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      console.log(error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleSignUp)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Cadastrar na plataforma</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Preencha os campos para fazer seu cadastro
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="real-estate-name">
            Nome da imobiliária
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Building2 />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-name"
              type="text"
              placeholder="Imobiliária Demo"
              required
              {...register("realEstateProfile.name")}
            />
          </InputGroup>
        </Field>
        { errors.realEstateProfile?.name && (
          <FieldDescription className="text-rose-500">
            {errors.realEstateProfile.name.message}
          </FieldDescription>
        )}
        <Field>
          <FieldLabel htmlFor="real-estate-cnpj">CNPJ</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <FileText />
            </InputGroupAddon>
            <InputGroupInput
              id="real-estate-cnpj"
              type="text"
              placeholder="00.000.000/0000-00"
              required
              {...register("realEstateProfile.cnpj")}
            />
          </InputGroup>
        </Field>
        { errors.realEstateProfile?.cnpj && (
          <FieldDescription className="text-rose-500">
            {errors.realEstateProfile.cnpj.message}
          </FieldDescription>
        )}
        <Field>
          <FieldLabel htmlFor="responsible-name">
            Nome do responsável
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <SquareUser />
            </InputGroupAddon>
            <InputGroupInput
              id="responsible-name"
              type="text"
              placeholder="João da Silva"
              required
              {...register("realEstateProfile.responsibleName")}
            />
          </InputGroup>
        </Field>
        { errors.realEstateProfile?.responsibleName && (
          <FieldDescription className="text-rose-500">
            {errors.realEstateProfile.responsibleName.message}
          </FieldDescription>
        )}
        <Field>
          <FieldLabel htmlFor="phone">Telefone</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <SquareUser />
            </InputGroupAddon>
            <InputGroupInput
              id="phone"
              type="text"
              placeholder="(00) 00000-0000"
              required
              {...register("realEstateProfile.phone")}
            />
          </InputGroup>
        </Field>
        { errors.realEstateProfile?.phone && (
          <FieldDescription className="text-rose-500">
            {errors.realEstateProfile.phone.message}
          </FieldDescription>
        )}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              type="email"
              placeholder="example@email.com"
              required
              {...register("email")}
            />
          </InputGroup>
        </Field>
        { errors.email && (
          <FieldDescription className="text-rose-500">
            {errors.email.message}
          </FieldDescription>
        )}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="********"
            required
            {...register("password")}
          />
        </Field>
        { errors.password && (
          <FieldDescription className="text-rose-500">
            {errors.password.message}
          </FieldDescription>
        )}
        <Field>
          <Button type="submit">
            {isSubmitting ? (
              <span>
                <Loader2 className="animate-spin" /> Cadastrando...
              </span>
            ) : (
              "Cadastrar"
            )}
          </Button>
        </Field>
        <FieldSeparator />
        <Field>
          <FieldDescription className="text-center text-foreground">
            Já possui uma conta?{" "}
            <Link to="/sign-in" className="underline underline-offset-4">
              Fazer login
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
