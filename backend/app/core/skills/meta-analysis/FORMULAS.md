# Meta-Analysis Formulas - Quick Reference

## Effect Size Calculations

### Dichotomous Outcomes

#### 2×2 Table Setup
```
                Disease+    Disease-    Total
Exposed            a           b         n₁
Unexposed          c           d         n₂
                  m₁          m₂         N
```

#### Risk Ratio (RR)
```
RR = (a/n₁) / (c/n₂)

log(RR) = ln(a/n₁) - ln(c/n₂)

SE(log RR) = √(1/a - 1/n₁ + 1/c - 1/n₂)

95% CI for RR = exp(log(RR) ± 1.96 × SE)
```

#### Odds Ratio (OR)
```
OR = (a × d) / (b × c)

log(OR) = ln(a) + ln(d) - ln(b) - ln(c)

SE(log OR) = √(1/a + 1/b + 1/c + 1/d)

95% CI for OR = exp(log(OR) ± 1.96 × SE)
```

#### Risk Difference (RD)
```
RD = (a/n₁) - (c/n₂)

SE(RD) = √((a×b)/(n₁³) + (c×d)/(n₂³))

95% CI for RD = RD ± 1.96 × SE
```

#### Number Needed to Treat (NNT)
```
NNT = 1 / |RD|

NNT = 1 / |CER × (1 - RR)|

where CER = control event rate
```

### Continuous Outcomes

#### Mean Difference (MD)
```
MD = Mean₁ - Mean₂

SE(MD) = √(SD₁²/n₁ + SD₂²/n₂)

95% CI for MD = MD ± 1.96 × SE
```

#### Standardized Mean Difference (SMD) - Cohen's d
```
SMD = (Mean₁ - Mean₂) / SD_pooled

SD_pooled = √(((n₁-1)×SD₁² + (n₂-1)×SD₂²) / (n₁ + n₂ - 2))

SE(SMD) = √(n₁+n₂)/(n₁×n₂) + SMD²/(2×(n₁+n₂))

95% CI for SMD = SMD ± 1.96 × SE
```

#### Hedges' g (Small-Sample Correction)
```
g = SMD × (1 - 3/(4×(n₁+n₂) - 9))

SE(g) ≈ SE(SMD) × (1 - 3/(4×(n₁+n₂) - 9))
```

### Time-to-Event Outcomes

#### Hazard Ratio from Published Data
```
If HR and 95% CI reported:
  log(HR) = ln(HR)
  SE(log HR) = (ln(Upper) - ln(Lower)) / 3.92

If HR and p-value reported:
  z = Φ⁻¹(1 - p/2)  [for two-sided p]
  SE(log HR) = |log(HR)| / z
```

---

## Converting Between Statistics

### SD from SE
```
SD = SE × √n
```

### SD from 95% CI
```
SD = √n × (Upper - Lower) / 3.92
```

### SD from IQR (Assuming Normal Distribution)
```
SD ≈ IQR / 1.35

More precise:
SD ≈ IQR / (2 × Φ⁻¹(0.75)) = IQR / 1.349
```

### SD from Range
```
For n ≤ 15:  SD ≈ Range / 4
For 16-70:  SD ≈ Range / 5
For n > 70: SD ≈ Range / 6

Wan et al. (2014) method:
SD ≈ Range / (2 × Φ⁻¹((n-0.375)/(n+0.25)))
```

### SE from t-statistic
```
SE = |Mean₁ - Mean₂| / t

where t is from unpaired t-test
```

### SE from p-value
```
z = Φ⁻¹(1 - p/2)  [two-sided]
SE = |Effect| / z
```

### Converting OR to RR
```
RR = OR / (1 - p₀ + p₀ × OR)

where p₀ = baseline risk in control group

When outcome rare (<10%): RR ≈ OR
```

### Converting HR to OR (Approximate)
```
For rare events and short follow-up:
OR ≈ HR

For common events:
OR ≈ HR × (1 + r) / (1 + r × HR)
where r = control group event rate
```

---

## Pooling Formulas

### Fixed-Effect Model (Inverse Variance)

```
Pooled effect (θ̂) = Σ(wᵢ × θᵢ) / Σwᵢ

where wᵢ = 1/SE²ᵢ (inverse variance weight)

SE(θ̂) = √(1 / Σwᵢ)

95% CI = θ̂ ± 1.96 × SE(θ̂)
```

### Random-Effects Model

```
Pooled effect (θ̂) = Σ(wᵢ* × θᵢ) / Σwᵢ*

where wᵢ* = 1/(SE²ᵢ + τ²)

τ² = between-study variance
```

#### DerSimonian-Laird τ² Estimator
```
τ²_DL = max(0, (Q - (k-1)) / C)

where:
Q = Σwᵢ(θᵢ - θ̂_FE)² [Cochran's Q]
k = number of studies
C = Σwᵢ - Σwᵢ²/Σwᵢ
```

---

## Heterogeneity Statistics

### Cochran's Q
```
Q = Σwᵢ(θᵢ - θ̂)²

Under null (homogeneity): Q ~ χ²(k-1)

p-value = P(χ² > Q)
```

### I² Statistic
```
I² = max(0, (Q - (k-1)) / Q) × 100%

Interpretation:
0-40%: Low
30-60%: Moderate
50-90%: Substantial
75-100%: Considerable
```

### τ² and τ
```
τ² = between-study variance (in squared effect units)
τ = √τ² = SD of true effects (in effect units)
```

### H² Statistic
```
H² = Q / (k-1)

H = √H²

I² = (H² - 1) / H² = 1 - 1/H²
```

### Prediction Interval
```
95% PI = θ̂ ± t_{k-2, 0.975} × √(τ² + SE²(θ̂))

For k ≥ 3, t critical value approaches 1.96
```

---

## Subgroup Analysis

### Test for Subgroup Differences
```
Q_between = Q_total - Σ(Q_within_subgroups)

df = number of subgroups - 1

p-value = P(χ² > Q_between)
```

### Interaction Test (Meta-Regression)
```
β = difference between subgroup effects
SE(β) = √(SE₁² + SE₂²)
z = β / SE(β)
p = 2 × (1 - Φ(|z|))
```

---

## Publication Bias

### Egger's Test
```
Regression: Effect/SE = β₀ + β₁(1/SE)

Test for bias: H₀: β₀ = 0
t = β₀ / SE(β₀)
```

### Begg's Test
```
Rank correlation between effect size and variance
Kendall's τ with continuity correction
```

### Trim and Fill
```
1. Estimate number of missing studies (k₀)
2. Impute k₀ studies symmetric to existing
3. Recalculate pooled effect
```

### Fail-Safe N (Rosenthal)
```
N_fs = ((Σzᵢ)² / z_crit²) - k

where:
zᵢ = z-score for study i
z_crit = 1.645 (one-sided α=0.05)
k = number of studies

Interpretation: Number of null studies needed to make result non-significant
```

---

## Sample Size and Power

### Optimal Information Size (OIS)
```
For dichotomous outcomes:
OIS = 4 × (z_α + z_β)² / (RRR × CER × (1-CER))

where:
RRR = relative risk reduction
CER = control event rate
z_α = 1.96 (for α=0.05)
z_β = 0.84 (for 80% power)
```

### Minimum Number of Studies for Tests
```
Heterogeneity tests: ≥2 studies (but low power <10)
Publication bias tests: ≥10 studies
Meta-regression: ≥10 studies per covariate
```

---

## Special Cases

### Zero Events (Continuity Correction)
```
Add 0.5 to all cells:
a' = a + 0.5, b' = b + 0.5
c' = c + 0.5, d' = d + 0.5

Or use Peto OR for sparse data
```

### Peto Odds Ratio
```
O - E = a - (n₁ × m₁)/N
V = (n₁ × n₂ × m₁ × m₂) / (N² × (N-1))

log(OR)_Peto = (O - E) / V
SE = 1 / √V
```

### Cluster RCTs
```
Effective sample size = N / Design Effect
Design Effect = 1 + (m - 1) × ICC

where:
m = average cluster size
ICC = intraclass correlation coefficient
```

### Crossover Trials
```
If paired analysis available:
Use MD and SE directly

If only per-period data:
Assume correlation r = 0.5 (conservative)
SE = √(SD₁²/n + SD₂²/n - 2×r×SD₁×SD₂/n)
```

---

## Quick Reference Tables

### Critical Values
| α (two-sided) | z |
|---------------|---|
| 0.10 | 1.645 |
| 0.05 | 1.960 |
| 0.01 | 2.576 |
| 0.001 | 3.291 |

### Effect Size Interpretation
| SMD | Interpretation |
|-----|----------------|
| 0.2 | Small |
| 0.5 | Medium |
| 0.8 | Large |

| RR/OR | Interpretation |
|-------|----------------|
| <0.5 or >2.0 | Large effect |
| 0.5-0.7 or 1.4-2.0 | Moderate |
| 0.7-0.9 or 1.1-1.4 | Small |
| 0.9-1.1 | Negligible |

### I² and τ² Relationship
```
Given fixed I², τ² depends on precision:
- High-precision studies → low τ² needed for same I²
- Low-precision studies → high τ² needed for same I²

τ² is scale-dependent; I² is not
```
