function [ P1, P2, Ytest ] = sph_bayes(Xtest, mu1, mu2, sigma1, sigma2)

pdens = @(mu, sigma) (1/((2*pi)^(3/2)*sigma^(3/2)))*exp(-(1/(2*sigma))*((Xtest'-mu)'*(Xtest'-mu)));

P1 = pdens(mu1, sigma1)/(pdens(mu1, sigma1)+pdens(mu2,sigma2));
P2 = pdens(mu2, sigma2)/(pdens(mu1, sigma1)+pdens(mu2,sigma2));

Ytest = -1;
if (P1 > P2) 
    Ytest = 1;
end
    

end

