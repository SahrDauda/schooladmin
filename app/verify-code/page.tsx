const [code, setCode] = useState("")
const [loading, setLoading] = useState(false)
const [email, setEmail] = useState("")
const router = useRouter()

useEffect(() => {
  const storedEmail = sessionStorage.getItem("resetEmail")
  if (!storedEmail) {
    toast({
      title: "Session Expired",
      description: "Please request a new verification code.",
      variant: "destructive",
    })
      < CardTitle className = "text-center" > Verify Code</CardTitle >
        </CardHeader >
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              Enter the 4-digit verification code sent to:
            </p>
            <p className="font-medium">{email}</p>
          </div>
          <Input
            type="text"
            placeholder="Enter 4-digit code"
            value={code}
            onChange={e => setCode(e.target.value)}
            maxLength={4}
            pattern="[0-9]{4}"
            required
            disabled={loading}
            className="text-center text-lg tracking-widest"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/forgot-password")}
          >
            Back to Forgot Password
          </Button>
        </form>
      </CardContent>
      </Card >
    </div >
  )
} 