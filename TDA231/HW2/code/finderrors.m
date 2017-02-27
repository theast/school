function [ errors1, errors2 ] = finderrors( p, mu1, mu2, sigma1, sigma2, offset )

errors1 = 0;
errors2 = 0;

for i = 1:offset
    [P1, P2, Ytest1] = sph_bayes(p(i,:), mu1, mu2, sigma1, sigma2);
    Ytest2 = new_classifier(p(i,:), mu1, mu2);
    if(Ytest1 == -1) 
        errors1 = errors1 + 1;
    end
    if(Ytest2 == -1)
        errors2 = errors2 + 1;
    end
    [P1, P2, Ytest1] = sph_bayes(p(i+offset,:), mu1, mu2, sigma1, sigma2);
    Ytest2 = new_classifier(p(i+offset,:), mu1, mu2);
    if(Ytest1 == 1) 
        errors1 = errors1 + 1;
    end
    if(Ytest2 == 1)
        errors2 = errors2 + 1;
    end
end

end

