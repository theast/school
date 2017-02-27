function [mu1, mu2, sigma1, sigma2] = sgeass21(x)
[n, p] = size(x);

mu1 = zeros(p,1);
mu2 = zeros(p,1);
 
for i=1:p
    mu1(i) = sum(x(1:n/2,i))/n;
    mu2(i) = sum(x(n/2 + 1:n,i))/n;
end

sigma1 = 0;
sigma2 = 0;

for i=1:n/2
   sub1 = x(i,:)' - mu1;
   sigma1 = sigma1 + sub1'*sub1;
   
   sub2 = x(i+n/2,:)' - mu2;
   sigma2 = sigma2 + sub2'*sub2;
end

sigma1 = sigma1 * 1/((n/2)*p);
sigma2 = sigma2 * 1/((n/2)*p);
end