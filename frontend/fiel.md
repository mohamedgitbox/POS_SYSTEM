# PDE Revision – Complementary Function & Particular Integral

## 1. General Idea
When solving a PDE involving derivatives with respect to y only, treat x as a constant and solve it as an ODE in y.

General solution:

\[Z_G=Z_c+Z_p\]

- CF: Complementary Function, solution of the homogeneous equation.
- PI: Particular Integral, a particular solution of the non-homogeneous equation.

## 2. Complementary Function (CF)
Set the right-hand side equal to zero, then form the characteristic equation by assuming \(z=e^{my}\).

### Types of roots
| Roots | CF |
|---|---|
| Distinct real roots \(m_1,m_2\) | \(\phi_1(x)e^{m_1y}+\phi_2(x)e^{m_2y}\) |
| Imaginary roots \(\pm ai\) | \(\phi_1(x)\cos ay+\phi_2(x)\sin ay\) |
| Repeated root \(m\) | \((\phi_1(x)+y\phi_2(x))e^{my}\) |

## 3. Particular Integral (PI)
Choose a suitable polynomial according to the degree of the RHS in y:

| RHS degree in y | Assume PI |
|---|---|
| 0 | \(A\) |
| 1 | \(Ay+B\) |
| 2 | \(Ay^2+By+C\) |
| 3 | \(Ay^3+By^2+Cy+D\) |

Differentiate, substitute into the original equation, then compare coefficients.

## 4. Example 1
\[z_{yy}+4z=8x^2\]

Homogeneous equation:
\[m^2+4=0\Rightarrow m=\pm2i\]

\[Z_c=\phi_1(x)\cos2y+\phi_2(x)\sin2y\]

Assume \(Z_p=A\). Then \(Z_{p,y}=Z_{p,yy}=0\).

\[4A=8x^2\Rightarrow A=2x^2\]

\[Z_p=2x^2\]

Final answer:
\[\boxed{z=\phi_1(x)\cos2y+\phi_2(x)\sin2y+2x^2}\]

## 5. Example 2
\[z_{yy}-2z_y-3z=y^2(2+3x)\]

Characteristic equation:
\[m^2-2m-3=0\]
\[(m+1)(m-3)=0\Rightarrow m=-1,3\]

\[Z_c=\phi_1(x)e^{-y}+\phi_2(x)e^{3y}\]

Assume:
\[Z_p=Ay^2+By+C\]

Derivatives:
\[Z_{p,y}=2Ay+B,\quad Z_{p,yy}=2A\]

Substitute:
\[2A-2(2Ay+B)-3(Ay^2+By+C)=y^2(2+3x)\]

Compare coefficients:

\[-3A=2+3x\Rightarrow A=-\frac23-x\]

\[-4A-3B=0\Rightarrow B=\frac89+\frac43x\]

\[2A-2B-3C=0\Rightarrow C=-\frac{14}{9}x-\frac{28}{27}\]

Therefore:
\[Z_p=\left(-\frac23-x\right)y^2+\left(\frac89+\frac43x\right)y-\frac{14}{9}x-\frac{28}{27}\]

Final answer:
\[\boxed{z=\phi_1(x)e^{-y}+\phi_2(x)e^{3y}+Z_p}\]

## 6. Exam Workflow
1. Treat x as constant.
2. Write \(Z_G=Z_c+Z_p\).
3. Set RHS to zero and find CF.
4. Form the characteristic equation.
5. Identify the roots and write CF.
6. Assume a suitable PI.
7. Differentiate and substitute.
8. Compare coefficients.
9. Add CF and PI.