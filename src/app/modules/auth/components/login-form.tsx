// Components
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

// Libs
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Mail, SquareAsterisk } from "lucide-react";
import { signIn } from "@/api/sign-in";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";

// Hooks
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";


import { getRoleBasePath } from "@/types/auth";

const signInForm = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Informe a senha."),
});

type SignInForm = z.infer<typeof signInForm>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { save } = useAuth();

  const { register, handleSubmit, formState: { isSubmitting }, watch } = useForm<SignInForm>({
    defaultValues: {
      email: searchParams.get('email') || '',
      password: ''
    }
  })

  const currentEmail = watch('email')
  const forgotPasswordUrl = currentEmail 
  ? `/forgot-password?email=${currentEmail}` 
  : '/forgot-password';

  const { mutateAsync: login,  } = useMutation({
    mutationFn: signIn,
    onSuccess: () => {
      toast.success('Login realizado com sucesso!')
    },
    onError: (error) => {
      console.log(error.message)
    }
  })

  async function handleSignIn(data: SignInForm) {
    try {
      const response = await login({
        email: data.email,
        password: data.password
      })

      save(response.data);

      const basePath = getRoleBasePath(response.data.user.role);

      navigate(`${basePath}/dashboard`);
    } catch (error) {
      toast.error("Email ou senha incorretos.")
    }
  }


  return (
    <form onSubmit={handleSubmit(handleSignIn)} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Faça login em sua conta</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Digite seu email e senha para acessar sua conta
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Mail />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              type="email"
              placeholder="Digite seu email"
              required
              {...register('email')}
            />
          </InputGroup>
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Link
              to={forgotPasswordUrl}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <InputGroup>
            <InputGroupAddon>
              <SquareAsterisk />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              required
              {...register('password')}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                className="text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <Button type="submit">{isSubmitting ? <span><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</span> : 'Entrar'}</Button>
        </Field>
        <FieldSeparator></FieldSeparator>
        <Field>
          <FieldDescription className="text-foreground text-center">
            Não possui uma conta?{" "}
            <Link to="/sign-up" className="underline underline-offset-4">
              Cadastrar
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
